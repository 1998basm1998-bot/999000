// حصة الفرد بالكيلوغرام (كما موضح في الصورة)
const QUOTA_PER_PERSON = 9; 

// البيانات الافتراضية إذا كان التطبيق يفتح لأول مرة
const defaultData = {
    inventoryTotal: 50000,
    inventoryDistributed: 0,
    families: [
        { id: "12345678901", name: "محمد حسن علي", members: 7, status: "مستلم" },
        { id: "12345678902", name: "سارة محمود ياسين", members: 5, status: "مستلم" },
        { id: "12345678903", name: "أحمد ناصر حسين", members: 4, status: "غير مستلم" },
        { id: "12345678904", name: "حسين كاظم عباس", members: 6, status: "مستلم" },
        { id: "12345678905", name: "علي كريم جاسم", members: 8, status: "غير مستلم" }
    ]
};

// جلب البيانات من LocalStorage أو استخدام الافتراضية
let appData = JSON.parse(localStorage.getItem('wakilFlourApp')) || defaultData;

// دالة حفظ البيانات في المتصفح وتحديث الواجهة
function saveData() {
    localStorage.setItem('wakilFlourApp', JSON.stringify(appData));
    updateUI();
}

// 1. التنقل بين التبويبات السفلية
function switchTab(tabId, title, element) {
    // إخفاء كل الصفحات وإزالة التفعيل من الأزرار
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    // تفعيل الصفحة والزر المحددين
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
    document.getElementById('page-title').innerText = title;
    
    // تحديث البيانات عند الدخول لأي تبويب
    updateUI(); 
}

// 2. تحديث جميع واجهات النظام
function updateUI() {
    // حسابات العوائل
    const totalFamilies = appData.families.length;
    const receivedFamilies = appData.families.filter(f => f.status === "مستلم").length;
    const waitingFamilies = totalFamilies - receivedFamilies;
    
    // حسابات المخزون
    let distributedKg = 0;
    appData.families.forEach(f => {
        if(f.status === "مستلم") distributedKg += (f.members * QUOTA_PER_PERSON);
    });
    // تحديث الرقم في قاعدة البيانات
    appData.inventoryDistributed = distributedKg; 
    
    const remainingKg = appData.inventoryTotal - distributedKg;
    const progressPercent = appData.inventoryTotal > 0 ? (remainingKg / appData.inventoryTotal) * 100 : 0;

    // --- تحديث أرقام تبويب الرئيسية ---
    document.getElementById('stat-total-families').innerText = totalFamilies;
    document.getElementById('stat-received').innerText = receivedFamilies;
    document.getElementById('stat-waiting').innerText = waitingFamilies;
    
    document.getElementById('stat-remaining-inv').innerText = remainingKg.toLocaleString();
    document.getElementById('stat-total-inv').innerText = appData.inventoryTotal.toLocaleString();
    document.getElementById('inv-progress').style.width = `${progressPercent}%`;

    // --- تحديث أرقام تبويب المخزون ---
    document.getElementById('inv-total').innerText = appData.inventoryTotal.toLocaleString();
    document.getElementById('inv-distributed').innerText = distributedKg.toLocaleString();

    // تحديث القوائم
    renderFamiliesList();
    renderDeliverySelect();
}

// 3. إدارة العوائل
function renderFamiliesList(searchTerm = "") {
    const list = document.getElementById('families-list');
    list.innerHTML = '';

    appData.families.forEach(f => {
        if (f.name.includes(searchTerm) || f.id.includes(searchTerm)) {
            const isReceived = f.status === "مستلم";
            const badgeClass = isReceived ? "status-received" : "status-waiting";
            const icon = isReceived ? "fa-check" : "fa-clock";

            list.innerHTML += `
                <div class="family-card neu-out flex-between">
                    <div>
                        <h4>${f.name}</h4>
                        <p class="text-sm text-muted mt-5">البطاقة: ${f.id} | الأفراد: ${f.members}</p>
                    </div>
                    <div class="status-badge ${badgeClass}">
                        <i class="fa-solid ${icon} mr-5"></i>${f.status}
                    </div>
                </div>
            `;
        }
    });
}

function filterFamilies() {
    const term = document.getElementById('search-input').value;
    renderFamiliesList(term);
}

// نوافذ منبثقة Modal
function toggleModal(modalId, show) {
    document.getElementById(modalId).style.display = show ? 'flex' : 'none';
}

function addFamily() {
    const name = document.getElementById('add-f-name').value;
    const id = document.getElementById('add-f-card').value;
    const members = parseInt(document.getElementById('add-f-members').value);

    if (!name || !id || !members) {
        alert("يرجى تعبئة جميع الحقول بشكل صحيح!");
        return;
    }

    // التأكد من عدم تكرار رقم البطاقة
    if(appData.families.some(f => f.id === id)) {
        alert("رقم البطاقة التموينية مسجل مسبقاً!");
        return;
    }

    appData.families.unshift({ id: id, name: name, members: members, status: "غير مستلم" });
    
    // تصفير الحقول
    document.getElementById('add-f-name').value = '';
    document.getElementById('add-f-card').value = '';
    document.getElementById('add-f-members').value = '';
    
    saveData();
    toggleModal('add-family-modal', false);
    alert("تمت إضافة العائلة بنجاح!");
}

// 4. نظام تسليم الحصة
function renderDeliverySelect() {
    const select = document.getElementById('family-select');
    select.innerHTML = '<option value="">-- اضغط لاختيار عائلة --</option>';
    
    // جلب العوائل غير المستلمة فقط
    const waitingFamilies = appData.families.filter(f => f.status === "غير مستلم");
    
    waitingFamilies.forEach(f => {
        select.innerHTML += `<option value="${f.id}">${f.name} (البطاقة: ${f.id})</option>`;
    });
    
    document.getElementById('delivery-details').style.display = 'none';
    document.getElementById('del-quota-per-person').innerText = QUOTA_PER_PERSON;
}

function calcDelivery() {
    const selectId = document.getElementById('family-select').value;
    const detailsDiv = document.getElementById('delivery-details');
    
    if (selectId) {
        const family = appData.families.find(f => f.id === selectId);
        const totalQuota = family.members * QUOTA_PER_PERSON;
        
        document.getElementById('del-members').innerText = family.members;
        document.getElementById('del-total-kg').innerText = totalQuota + " كغم";
        detailsDiv.style.display = 'block';
    } else {
        detailsDiv.style.display = 'none';
    }
}

function confirmDelivery() {
    const selectId = document.getElementById('family-select').value;
    if (!selectId) return;

    const family = appData.families.find(f => f.id === selectId);
    const totalQuota = family.members * QUOTA_PER_PERSON;
    const remainingKg = appData.inventoryTotal - appData.inventoryDistributed;

    if(totalQuota > remainingKg) {
        alert("تنبيه: المخزون الحالي لا يكفي لتسليم هذه الحصة!");
        return;
    }

    if(confirm(`هل أنت متأكد من تسليم حصة (${totalQuota} كغم) لعائلة ${family.name}؟`)) {
        const familyIndex = appData.families.findIndex(f => f.id === selectId);
        appData.families[familyIndex].status = "مستلم";
        saveData();
        alert("تم التسليم بنجاح وخصم الكمية من المخزون!");
        
        // العودة للرئيسية تلقائياً
        document.querySelector('.nav-item').click();
    }
}

// 5. إضافة مخزون
function addInventory() {
    const newStock = parseInt(document.getElementById('new-stock-input').value);
    if(!newStock || newStock <= 0) {
        alert("يرجى إدخال كمية صحيحة!");
        return;
    }

    appData.inventoryTotal += newStock;
    document.getElementById('new-stock-input').value = '';
    saveData();
    alert(`تمت إضافة ${newStock} كغم إلى المخزون بنجاح!`);
}

// تشغيل الواجهة عند فتح التطبيق
window.onload = updateUI;
