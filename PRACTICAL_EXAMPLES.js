/**
 * 📚 أمثلة عملية: كيفية استخدام API البحث بشكل آمن
 * 
 * يحتوي على أمثلة لجميع الحالات:
 * ✅ النجاح - ❌ الفشل - ⚠️ التحذيرات
 */

// ============================================================
// 1️⃣ تسجيل الدخول وإنشاء Token
// ============================================================

// ✅ مثال صحيح:
fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'student@example.com',
        password: 'SecurePassword123'
    })
})
.then(res => res.json())
.then(data => {
    const token = data.token; // حفظ الـ Token
    console.log('✅ تم تسجيل الدخول بنجاح');
});

// ============================================================
// 2️⃣ إنشاء خطة بحث (المرحلة الأولى)
// ============================================================

// ✅ مثال صحيح:
const planPayload = {
    title: 'دور القانون الإداري في حماية الحقوق الإنسانية',
    university: 'جامعة الجزائر',
    faculty: 'الحقوق',
    department: 'القانون العام',
    level: 'ماستر',
    doctorName: 'أ.د. محمد عزيز',
    students: ['أحمد محمد', 'فاطمة علي'],
    citationStyle: 'APA',
    sectionsCount: 2,
    demandsPerSection: 2
};

fetch('/api/research/plan', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(planPayload)
})
.then(res => res.json())
.then(data => {
    if (data._id) {
        console.log('✅ تم إنشاء الخطة بنجاح:');
        console.log(`   ID: ${data._id}`);
        console.log(`   النقاط المخصومة: ${data.pointsDeducted}`);
        console.log(`   النقاط المتبقية: ${data.remainingPoints}`);
        
        // حفظ researchId للاستخدام لاحقاً
        localStorage.setItem('researchId', data._id);
    }
})
.catch(err => console.error('❌ خطأ:', err));

// ============================================================
// 3️⃣ الحصول على حالة البحث الحالية
// ============================================================

// ✅ مثال صحيح:
const researchId = localStorage.getItem('researchId');

fetch(`/api/research/status/${researchId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(research => {
    console.log('✅ البيانات الحالية:');
    console.log(`   المرحلة: ${research.status.stage}`);
    console.log(`   التقدم: ${research.status.progress}%`);
    console.log(`   عدد العناصر: ${research.plan.length}`);
    
    // إرجاع معلومات الخطة
    return research.plan;
});

// ============================================================
// 4️⃣ تأكيد الخطة مع بيانات صحيحة
// ============================================================

// ✅ مثال صحيح - إرسال خطة نظيفة:
async function confirmPlanCorrect() {
    const researchId = localStorage.getItem('researchId');
    
    // الحصول على الخطة الحالية أولاً
    const statusRes = await fetch(`/api/research/status/${researchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const research = await statusRes.json();
    
    // تحضير البيانات بشكل صحيح
    const finalPlan = research.plan.map((item, index) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        content: item.content || '', // ✅ String فقط
        status: item.status,
        subPoints: item.subPoints || [],
        order: index,
        canEdit: true
    }));
    
    // إرسال الطلب
    const response = await fetch('/api/research/plan/confirm', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            researchId: researchId,
            finalPlan: finalPlan
        })
    });
    
    const data = await response.json();
    
    if (response.ok) {
        console.log('✅ تم تأكيد الخطة بنجاح!');
        console.log(`   إجمالي: ${data.validationStats.totalItems}`);
        console.log(`   مكتملة: ${data.validationStats.completedItems}`);
        console.log(`   معلقة: ${data.validationStats.pendingItems}`);
    } else {
        console.error('❌ فشل التأكيد:', data.message);
    }
}

// ============================================================
// 5️⃣ ❌ أخطاء شائعة يجب تجنبها
// ============================================================

// ❌ خطأ 1: إرسال Object بدلاً من String
const wrongPlan1 = [
    {
        id: 'item_1',
        title: 'المبحث الأول',
        type: 'demand',
        content: {  // ❌ هذا Object وليس string!
            '第一': 'القانون الإداري',
            '第二': 'تطبيقاته'
        },
        status: 'pending'
    }
];

// ✅ الحل: تحويل Object إلى JSON string
const correctPlan1 = [
    {
        id: 'item_1',
        title: 'المبحث الأول',
        type: 'demand',
        content: JSON.stringify({
            '第一': 'القانون الإداري',
            '第二': 'تطبيقاته'
        }, null, 2), // ✅ الآن يكون string
        status: 'pending'
    }
];

// ❌ خطأ 2: إرسال Array في content
const wrongPlan2 = [
    {
        id: 'item_1',
        content: ['نقطة 1', 'نقطة 2'] // ❌ Array
    }
];

// ✅ الحل: دمج Array إلى نص
const correctPlan2 = [
    {
        id: 'item_1',
        content: '• نقطة 1\n• نقطة 2' // ✅ String
    }
];

// ❌ خطأ 3: بيانات غير مكتملة
const wrongPlan3 = [
    {
        id: 'item_1',
        // ❌ مفقود: title, type, status, order
        content: 'محتوى'
    }
];

// ✅ الحل: إرسال جميع الحقول المطلوبة
const correctPlan3 = [
    {
        id: 'item_1',
        title: 'عنوان العنصر',
        type: 'demand',
        content: 'محتوى',
        status: 'pending',
        order: 0,
        canEdit: true
    }
];

// ============================================================
// 6️⃣ معالجة الأخطاء بشكل صح
// ============================================================

// ❌ معالجة خاطئة:
async function handleErrorWrong() {
    try {
        const response = await fetch('/api/research/plan/confirm', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ /* data */ })
        });
        
        const data = await response.json();
        // ❌ لا نتحقق من response.ok!
        console.log('تم:', data);
    } catch (error) {
        // ❌ معالجة عامة جداً
        console.log('حدث خطأ');
    }
}

// ✅ معالجة صحيحة:
async function handleErrorCorrect() {
    try {
        const response = await fetch('/api/research/plan/confirm', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ /* data */ })
        });
        
        const data = await response.json();
        
        // ✅ التحقق من الحالة
        if (!response.ok) {
            // ✅ معالجة الأخطاء المختلفة
            switch (response.status) {
                case 400:
                    console.error('❌ خطأ في البيانات:', data.message);
                    console.error('   حقل المشكلة:', data.field);
                    break;
                case 402:
                    console.error('❌ نقاط غير كافية:', data.message);
                    break;
                case 404:
                    console.error('❌ البحث غير موجود:', data.message);
                    break;
                case 500:
                    console.error('❌ خطأ في الخادم:', data.message);
                    break;
                default:
                    console.error(`❌ خطأ (${response.status}):`, data.message);
            }
            return;
        }
        
        // ✅ معالجة النجاح
        console.log('✅ تم بنجاح:', data.message);
        console.log('📊 الإحصائيات:', data.validationStats);
        
    } catch (error) {
        // ✅ معالجة أخطاء الشبكة
        console.error('❌ خطأ في الاتصال:', error.message);
    }
}

// ============================================================
// 7️⃣ دالة مساعدة آمنة للتحقق من البيانات
// ============================================================

/**
 * تحقق من صحة عنصر الخطة قبل الإرسال
 */
function validatePlanItem(item) {
    const errors = [];
    
    // التحقق من الحقول المطلوبة
    if (!item.id) errors.push('🔴 مفقود: id');
    if (!item.title) errors.push('🔴 مفقود: title');
    if (!item.type) errors.push('🔴 مفقود: type');
    
    // التحقق من أنواع البيانات
    if (typeof item.id !== 'string') errors.push('🔴 id يجب أن يكون string');
    if (typeof item.title !== 'string') errors.push('🔴 title يجب أن يكون string');
    if (typeof item.type !== 'string') errors.push('🔴 type يجب أن يكون string');
    if (typeof item.content !== 'string') errors.push('🔴 content يجب أن يكون string');
    
    // التحقق من القيم المسموحة
    const allowedTypes = ['introduction', 'section', 'demand', 'conclusion', 'references', 'problem_statement'];
    if (!allowedTypes.includes(item.type)) {
        errors.push(`🔴 نوع غير صحيح: ${item.type}`);
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ✅ استخدام الدالة:
const planItem = {
    id: 'item_1',
    title: 'المبحث الأول',
    type: 'demand',
    content: 'محتوى المبحث',
    status: 'pending'
};

const validation = validatePlanItem(planItem);
if (validation.isValid) {
    console.log('✅ البيانات صحيحة');
} else {
    console.log('❌ أخطاء في البيانات:');
    validation.errors.forEach(err => console.log('   ' + err));
}

// ============================================================
// 8️⃣ بدء عملية التوليد (المرحلة 3)
// ============================================================

// ✅ مثال صحيح:
async function startGeneration() {
    const researchId = localStorage.getItem('researchId');
    
    // تأكد من أن الخطة تم تأكيدها أولاً
    const statusRes = await fetch(`/api/research/status/${researchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const research = await statusRes.json();
    
    if (research.status.stage !== 'generating') {
        console.error('❌ يجب تأكيد الخطة أولاً');
        return;
    }
    
    // بدء التوليد (هذا يعمل في الخلفية)
    const response = await fetch(`/api/research/generate/${researchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    console.log('✅ بدأت عملية التوليد');
    console.log('⏳ يرجى الانتظار...');
    
    // التحقق من التقدم
    setTimeout(() => checkProgress(researchId), 3000);
}

// ✅ دالة للتحقق من التقدم:
async function checkProgress(researchId) {
    const response = await fetch(`/api/research/status/${researchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const research = await response.json();
    
    console.log(`📈 التقدم: ${research.status.progress}%`);
    console.log(`📋 المرحلة: ${research.status.stage}`);
    
    // حساب عدد العناصر المكتملة
    const completedCount = research.plan.filter(p => p.status === 'completed').length;
    const totalCount = research.plan.length;
    console.log(`✅/${totalCount}: ${completedCount} عنصر مكتمل`);
    
    // إذا لم تكتمل بعد، تحقق مجدداً بعد 5 ثوان
    if (research.status.progress < 100) {
        setTimeout(() => checkProgress(researchId), 5000);
    } else {
        console.log('🎉 تم إكمال البحث بنجاح!');
        console.log('📥 جاهز للتحميل الآن');
    }
}

// ============================================================
// 9️⃣ تحميل البحث بصيغة Word
// ============================================================

// ✅ مثال صحيح:
async function downloadResearch() {
    const researchId = localStorage.getItem('researchId');
    
    const response = await fetch(`/api/research/download/${researchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
        console.error('❌ فشل التحميل');
        return;
    }
    
    // تحميل الملف
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'البحث.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ تم تحميل البحث بنجاح');
}

// ============================================================
// 🔟 مثال كامل: تدفق عملي شامل
// ============================================================

async function completeResearchWorkflow() {
    console.log('🚀 بدء تدفق البحث الكامل...\n');
    
    try {
        // 1. تسجيل الدخول
        console.log('1️⃣ تسجيل الدخول...');
        const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'student@example.com',
                password: 'password123'
            })
        });
        const { token: accessToken } = await loginRes.json();
        console.log('✅ تم تسجيل الدخول\n');
        
        // 2. إنشاء خطة
        console.log('2️⃣ إنشاء خطة البحث...');
        const planRes = await fetch('/api/research/plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(planPayload)
        });
        const { _id: researchId, plan } = await planRes.json();
        console.log(`✅ تم إنشاء الخطة (${plan.length} عنصر)\n`);
        
        // 3. تأكيد الخطة
        console.log('3️⃣ تأكيد الخطة...');
        const confirmRes = await fetch('/api/research/plan/confirm', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                researchId: researchId,
                finalPlan: plan
            })
        });
        const confirmData = await confirmRes.json();
        console.log('✅ تم تأكيد الخطة\n');
        
        // 4. بدء التوليد
        console.log('4️⃣ بدء توليد المحتوى...');
        const generateRes = await fetch(`/api/research/generate/${researchId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        console.log('✅ بدأت عملية التوليد (يعمل في الخلفية)\n');
        
        // 5. الانتظار للانتهاء
        console.log('5️⃣ جاري انتظار اكتمال البحث...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // انتظر 10 ثواني
        
        // 6. التحميل
        console.log('6️⃣ تحميل البحث...');
        await downloadResearch();
        console.log('\n🎉 تم إكمال تدفق البحث بنجاح!');
        
    } catch (error) {
        console.error('\n❌ حدث خطأ:', error.message);
    }
}

// شغل التدفق الكامل:
// completeResearchWorkflow();
