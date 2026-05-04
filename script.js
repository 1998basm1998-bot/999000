// --- 1. البنية التحتية وقاعدة البيانات ---
const SYS_PASSWORD = "1001";
const defaultData = {
    settings: { quota: 9 }, // حصة الفرد
    inventory: { total: 0, distributed: 0 },
    families: []
};

let appData = JSON.parse(localStorage.getItem('wakilGlassPro')) || defaultData;
let confirmCallback = null; // لحفظ وظيفة التأكيد

function saveData() {
    localStorage.setItem('wakilGlassPro', JSON.stringify(appData));
    updateUI();
}

// --- 2. نظام التنبيهات 3D (بديل الـ Alert المزعج) ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let icon = 'fa-circle-info text-cyan';
    if(type === 'success') icon = 'fa-circle-check text-success';
    if(type === 'error') icon = 'fa-circle-xmark text-danger';

    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${icon} drop-shadow"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // إخفاء وحذف بعد 3.5 ثواني
    setTimeout(() => {
        toast.style.animation = 'slideOutToast 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// نافذة التأكيد الزجاجية (بديل confirm المتصفح)
function customConfirm(msg, callback) {
    document.getElementById('confirm-msg').innerText = msg;
    document.getElementById('confirm-modal').classList.remove('hidden');
    
    const yesBtn = document.getElementById('confirm-yes');
    const newYesBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    
    newYesBtn.addEventListener('click', () => {
        closeModal('confirm-modal');
        callback();
    });
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// --- 3. نظام البصمة والحماية ---
function showPasswordInput() {
    document.querySelector('.fingerprint-icon').style.animation = 'none';
    document.getElementById('lock-hint').classList.add('hidden');
    document.getElementById('password-area').classList.remove('hidden');
    document.getElementById('sys-password').focus();
}

function checkLogin() {
    const pass = document.getElementById('sys-password').value;
    if(pass === SYS_PASSWORD) {
        document.getElementById('lock-screen').style.opacity = '0';
        document.getElementById('lock-screen').style.transition = '0.5s ease';
        setTimeout(() => {
            document.getElementById('lock-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            showToast('تم التحقق، مرحباً بك في النظام', 'success');
            updateUI();
        }, 500);
    } else {
        showToast('كلمة المرور غير صحيحة!', 'error');
        document.getElementById('sys-password').value = '';
    }
}

// --- 4. التنقل بين التبويبات السفلية ---
function switchTab(tabId, title, element) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
    document.getElementById('page-title').innerText = title;
    updateUI();
}

// تحديث جميع بيانات الواجهة
function updateUI() {
    const totalFam = appData.families.length;
    const recFam = appData.families.filter(f => f.status === "مستلم").length;
    
    document.getElementById('stat-total-families').innerText = totalFam;
    document.getElementById('stat-received').innerText = recFam;
    document.getElementById('stat-waiting').innerText = totalFam - recFam;
    
    const remainKg = appData.inventory.total - appData.inventory.distributed;
    const prog = appData.inventory.total > 0 ? (remainKg / appData.inventory.total) * 100 : 0;
    
    document.getElementById('stat-remaining-inv').innerText = remainKg.toLocaleString();
    document.getElementById('inv-progress').style.width = `${prog}%`;

    document.getElementById('setting-quota').value = appData.settings.quota;

    renderFamiliesList();
    renderDeliverySelect();
    renderHistoryList();
}

// --- 5. نظام إدارة العوائل ---
function renderFamiliesList(term = "") {
    const list = document.getElementById('families-list');
    list.innerHTML = '';
    
    appData.families.forEach((f, index) => {
        if(f.name.includes(term) || f.id.includes(term)) {
            const statusClass = f.status === "مستلم" ? "done" : "wait";
            const iconStatus = f.status === "مستلم" ? "fa-check text-success" : "fa-clock text-warning";
            const debtHTML = f.debt > 0 ? `<p class="text-danger text-sm mt-5 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> ديون سابقة معلقة: ${f.debt} كغم</p>` : '';
            
            list.innerHTML += `
                <div class="glass-card 3d-in list-item ${statusClass}">
                    <div class="flex-between mb-5">
                        <h3 class="text-cyan text-shadow">${f.name}</h3>
                        <span class="text-light text-sm font-bold"><i class="fa-solid ${iconStatus}"></i> ${f.status}</span>
                    </div>
                    <p class="text-white text-sm"><i class="fa-solid fa-id-card text-light"></i> ${f.id} | <i class="fa-solid fa-users text-light"></i> ${f.members} أفراد</p>
                    ${debtHTML}
                    <div class="flex-between mt-10 border-top pt-10">
                        <button class="action-btn text-warning" onclick="openFamilyModal('${f.id}')"><i class="fa-solid fa-pen mr-5"></i> تعديل</button>
                        <button class="action-btn text-danger" onclick="deleteFamily('${f.id}')"><i class="fa-solid fa-trash mr-5"></i> حذف</button>
                    </div>
                </div>
            `;
        }
    });
}
function filterFamilies() { renderFamiliesList(document.getElementById('search-input').value); }

function openFamilyModal(id = 'add') {
    if(id === 'add') {
        document.getElementById('fam-modal-title').innerText = "إضافة عائلة جديدة";
        document.getElementById('fam-old-id').value = "";
        document.getElementById('fam-name').value = "";
        document.getElementById('fam-card').value = "";
        document.getElementById('fam-members').value = "";
    } else {
        const f = appData.families.find(x => x.id === id);
        document.getElementById('fam-modal-title').innerText = "تعديل بيانات العائلة";
        document.getElementById('fam-old-id').value = f.id;
        document.getElementById('fam-name').value = f.name;
        document.getElementById('fam-card').value = f.id;
        document.getElementById('fam-members').value = f.members;
    }
    document.getElementById('family-modal').classList.remove('hidden');
}

function saveFamily() {
    const oldId = document.getElementById('fam-old-id').value;
    const name = document.getElementById('fam-name').value;
    const id = document.getElementById('fam-card').value;
    const members = parseInt(document.getElementById('fam-members').value);

    if(!name || !id || !members) return showToast("يرجى تعبئة جميع الحقول بشكل صحيح", "error");

    if(oldId) { // التعديل
        // منع تكرار البطاقة لعائلة أخرى
        if(appData.families.some(x => x.id === id && x.id !== oldId)) return showToast("رقم البطاقة مسجل لعائلة أخرى!", "error");
        
        const index = appData.families.findIndex(x => x.id === oldId);
        appData.families[index].name = name;
        appData.families[index].id = id;
        appData.families[index].members = members;
        showToast("تم تعديل البيانات بنجاح", "success");
    } else { // الإضافة
        if(appData.families.some(x => x.id === id)) return showToast("رقم البطاقة مسجل مسبقاً!", "error");
        
        appData.families.unshift({ id, name, members, status: "غير مستلم", debt: 0, history: [] });
        showToast("تمت إضافة العائلة للسجل", "success");
    }
    closeModal('family-modal'); saveData();
}

function deleteFamily(id) {
    customConfirm("حذف العائلة سيؤدي لمسح جميع ديونها وسجلها. هل أنت متأكد؟", () => {
        appData.families = appData.families.filter(x => x.id !== id);
        saveData();
        showToast("تم حذف العائلة نهائياً", "success");
    });
}

// --- 6. نظام التسليم والديون الذكي ---
function renderDeliverySelect() {
    const select = document.getElementById('family-select');
    select.innerHTML = '<option value="">-- اضغط لاختيار العائلة --</option>';
    appData.families.filter(f => f.status === "غير مستلم").forEach(f => {
        select.innerHTML += `<option value="${f.id}">${f.name}</option>`;
    });
    document.getElementById('delivery-details').classList.add('hidden');
}

function calcDelivery() {
    const id = document.getElementById('family-select').value;
    const detailsDiv = document.getElementById('delivery-details');
    
    if(!id) return detailsDiv.classList.add('hidden');
    
    const f = appData.families.find(x => x.id === id);
    const requiredTotal = (f.members * appData.settings.quota) + (f.debt || 0);
    
    document.getElementById('del-members').innerText = f.members;
    document.getElementById('del-old-debt').innerText = (f.debt || 0) + " كغم";
    document.getElementById('del-total-req').innerText = requiredTotal + " كغم";
    
    document.getElementById('del-actual-paid').value = requiredTotal; // الافتراضي يسلم كاملاً
    calcNewDebt();
    
    detailsDiv.classList.remove('hidden');
}

function calcNewDebt() {
    const req = parseInt(document.getElementById('del-total-req').innerText);
    const actual = parseFloat(document.getElementById('del-actual-paid').value) || 0;
    const newDebt = req - actual;
    
    document.getElementById('del-new-debt').innerText = newDebt > 0 ? newDebt + " كغم" : "0 كغم";
}

function processDelivery() {
    const id = document.getElementById('family-select').value;
    const actual = parseFloat(document.getElementById('del-actual-paid').value);
    
    if(!id || isNaN(actual) || actual < 0) return showToast("يرجى إدخال كمية صحيحة للتسليم", "error");
    
    const remainingStock = appData.inventory.total - appData.inventory.distributed;
    if(actual > remainingStock) return showToast("عذراً، الرصيد المتبقي في المخزن لا يكفي!", "error");

    customConfirm(`سيتم خصم ${actual} كغم من رصيد المخزن وتسليمها للعائلة. تأكيد؟`, () => {
        const f = appData.families.find(x => x.id === id);
        const reqTotal = (f.members * appData.settings.quota) + (f.debt || 0);
        const newDebt = reqTotal - actual;
        
        f.status = "مستلم";
        f.debt = newDebt > 0 ? newDebt : 0; 
        
        // حفظ التاريخ والسجل
        const d = new Date();
        const dateStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} - ${d.getHours()}:${d.getMinutes()}`;
        if(!f.history) f.history = [];
        f.history.unshift({ date: dateStr, amount: actual, debtLeft: f.debt });
        
        appData.inventory.distributed += actual; // الخصم من المخزن العام
        
        saveData();
        showToast("تم تأكيد الاستلام بنجاح", "success");
        if(f.debt > 0) setTimeout(() => showToast(`تم تقييد دين (${f.debt} كغم) يضاف للشهر القادم`, "info"), 1500);
        
        document.querySelectorAll('.nav-item')[0].click(); // عودة للرئيسية
    });
}

// --- 7. بدء شهر جديد والسجل التاريخي ---
function triggerResetMonth() {
    customConfirm("هل أنت متأكد من تصفير حالة العوائل وبدء دورة توزيع جديدة؟ (لن يتم مسح ديونهم السابقة)", () => {
        appData.families.forEach(f => f.status = "غير مستلم");
        // نحول الباقي ليكون هو الإجمالي الجديد، ونصفر الموزع
        appData.inventory.total = appData.inventory.total - appData.inventory.distributed;
        appData.inventory.distributed = 0; 
        saveData();
        showToast("تم تصفير النظام وبدء دورة جديدة", "success");
    });
}

function renderHistoryList() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    
    appData.families.forEach(f => {
        if(f.history && f.history.length > 0) {
            f.history.forEach(h => {
                const debtTxt = h.debtLeft > 0 ? `<span class="text-danger font-bold"><i class="fa-solid fa-triangle-exclamation"></i> باقي دين: ${h.debtLeft}</span>` : `<span class="text-success"><i class="fa-solid fa-check-double"></i> مستوفى</span>`;
                list.innerHTML += `
                    <div class="glass-card 3d-in mb-10 border-right-cyan">
                        <div class="flex-between mb-5">
                            <strong class="text-cyan text-shadow">${f.name}</strong>
                            <strong class="text-white text-lg">${h.amount} كغم</strong>
                        </div>
                        <div class="flex-between text-sm text-light border-top pt-5">
                            <span><i class="fa-regular fa-calendar"></i> ${h.date}</span>
                            ${debtTxt}
                        </div>
                    </div>
                `;
            });
        }
    });
    if(list.innerHTML === '') list.innerHTML = '<p class="text-center text-light mt-10">لم تقم بأي عمليات تسليم بعد.</p>';
}

// --- 8. الإعدادات والنسخ الاحتياطي ---
function addInventory() {
    const add = parseFloat(document.getElementById('new-stock-input').value);
    if(add > 0) {
        appData.inventory.total += add;
        document.getElementById('new-stock-input').value = "";
        saveData();
        showToast(`تمت إضافة ${add} كغم إلى المخزن بنجاح`, "success");
    } else {
        showToast("الرجاء إدخال كمية صحيحة", "error");
    }
}

function saveSettings() {
    const q = parseInt(document.getElementById('setting-quota').value);
    if(q > 0) {
        appData.settings.quota = q;
        saveData();
        showToast("تم تحديث حصة الفرد، وتم تعديل استحقاق الجميع", "success");
    }
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `نسخة_وكيل_الطحين_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast("تم تنزيل النسخة الاحتياطية بنجاح", "success");
}

function importData(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if(imported.families && imported.inventory) {
                appData = imported;
                saveData();
                showToast("تم استعادة البيانات السابقة بنجاح", "success");
            } else {
                showToast("ملف النسخة الاحتياطية غير صالح", "error");
            }
        } catch(err) {
            showToast("حدث خطأ أثناء قراءة الملف", "error");
        }
    };
    reader.readAsText(file);
}
