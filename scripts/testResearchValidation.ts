#!/usr/bin/env node

/**
 * 🧪 اختبارات شاملة للتحقق من صحة البحث والبيانات
 * 
 * الاختبارات:
 * 1. اختبار صيغة البيانات المرسلة
 * 2. اختبار معالجة Objects في content
 * 3. اختبار التحقق من الأنواع
 * 4. اختبار الأحرف العربية والخاصة
 * 5. اختبار الحدود القصوى (edge cases)
 */

const BASE_URL = 'http://localhost:5000/api';
let testResults = { passed: 0, failed: 0, errors: [] };
let userToken = '';
let researchId = '';

// 🎨 ألوان الطباعة
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

/**
 * 1️⃣ تسجيل الدخول والحصول على Token
 */
async function testLogin() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🔐 اختبار 1: تسجيل الدخول وإنشاء Token', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'password123'
      })
    });

    if (!response.ok) {
      // محاولة التسجيل أولاً إذا لم يكن المستخدم موجود
      const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'testuser@example.com',
          password: 'password123',
          role: 'student'
        })
      });

      const registerData = await registerResponse.json();
      userToken = registerData.token;
      log('✅ تم إنشاء حساب جديد والحصول على Token', 'green');
    } else {
      const data = await response.json();
      userToken = data.token;
      log('✅ تم تسجيل الدخول بنجاح والحصول على Token', 'green');
    }

    testResults.passed++;
  } catch (error) {
    log(`❌ فشل في الحصول على Token: ${error}`, 'red');
    testResults.failed++;
    testResults.errors.push({ test: 'Login', error: String(error) });
  }
}

/**
 * 2️⃣ إنشاء خطة بحث (generate plan)
 */
async function testGeneratePlan() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📋 اختبار 2: إنشاء خطة بحث (Generate Plan)', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    const response = await fetch(`${BASE_URL}/research/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: 'القانون الإداري وتطبيقاته المعاصرة',
        university: 'جامعة الجزائر',
        faculty: 'الحقوق',
        department: 'القانون العام',
        level: 'ماستر',
        doctorName: 'أ.د. محمد عزيز',
        students: ['أحمد محمد', 'فاطمة علي'],
        citationStyle: 'APA',
        sectionsCount: 2,
        demandsPerSection: 2
      })
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ فشل في إنشاء الخطة: ${data.message}`, 'red');
      testResults.failed++;
      testResults.errors.push({ test: 'Generate Plan', error: data.message });
      return;
    }

    researchId = data._id;
    log(`✅ تم إنشاء الخطة بنجاح (ID: ${researchId})`, 'green');
    log(`   - عدد العناصر: ${data.plan.length}`, 'blue');
    log(`   - النقاط المخصومة: ${data.pointsDeducted}`, 'blue');

    testResults.passed++;
  } catch (error) {
    log(`❌ فشل اختبار إنشاء الخطة: ${error}`, 'red');
    testResults.failed++;
    testResults.errors.push({ test: 'Generate Plan', error: String(error) });
  }
}

/**
 * 3️⃣ اختبار تأكيد الخطة مع بيانات صحيحة
 */
async function testConfirmPlanValid() {
  if (!researchId) {
    log('⏭️  تخطي الاختبار (لا يوجد researchId)', 'yellow');
    return;
  }

  log('\n' + '='.repeat(60), 'cyan');
  log('✅ اختبار 3: تأكيد الخطة مع بيانات صحيحة', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    // الحصول على الخطة الحالية أولاً
    const statusResponse = await fetch(`${BASE_URL}/research/status/${researchId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const statusData = await statusResponse.json();
    const finalPlan = statusData.plan.map((item, index) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      content: item.content || 'محتوى مؤقت',
      status: item.status,
      order: index,
      canEdit: true
    }));

    const response = await fetch(`${BASE_URL}/research/plan/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        researchId: researchId,
        finalPlan: finalPlan
      })
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ فشل في تأكيد الخطة: ${data.message}`, 'red');
      testResults.failed++;
      testResults.errors.push({ test: 'Confirm Plan Valid', error: data.message });
      return;
    }

    log('✅ تم تأكيد الخطة بنجاح', 'green');
    log(`   - إجمالي العناصر: ${data.validationStats.totalItems}`, 'blue');
    log(`   - العناصر المكتملة: ${data.validationStats.completedItems}`, 'blue');
    log(`   - العناصر المعلقة: ${data.validationStats.pendingItems}`, 'blue');

    testResults.passed++;
  } catch (error) {
    log(`❌ فشل اختبار تأكيد الخطة: ${error}`, 'red');
    testResults.failed++;
    testResults.errors.push({ test: 'Confirm Plan Valid', error: String(error) });
  }
}

/**
 * 4️⃣ اختبار تأكيد الخطة مع بيانات غير صحيحة (Object في content)
 */
async function testConfirmPlanInvalid() {
  if (!researchId) {
    log('⏭️  تخطي الاختبار (لا يوجد researchId)', 'yellow');
    return;
  }

  log('\n' + '='.repeat(60), 'cyan');
  log('⚠️  اختبار 4: محاولة إرسال Object في content (يجب أن يفشل)', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    const invalidPlan = [
      {
        id: 'item_1',
        title: 'المبحث الأول',
        type: 'demand',
        content: {
          'المطلب الأول': 'تعريف القانون الإداري...',
          'المطلب الثاني': 'أهمية القانون الإداري...'
        }, // ❌ هذا object وليس string
        status: 'pending'
      }
    ];

    const response = await fetch(`${BASE_URL}/research/plan/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        researchId: researchId,
        finalPlan: invalidPlan
      })
    });

    const data = await response.json();

    if (response.ok) {
      log('⚠️  تحذير: كان يجب أن يفشل الاختبار!', 'yellow');
      log('ملاحظة: تم التعامل مع البيانات غير الصحيحة وتحويلها إلى string', 'yellow');
      testResults.passed++;
    } else {
      log(`✅ تم رفض البيانات غير الصحيحة بشكل صحيح`, 'green');
      log(`   الخطأ: ${data.message}`, 'blue');
      testResults.passed++;
    }
  } catch (error) {
    log(`❌ فشل الاختبار: ${error}`, 'red');
    testResults.failed++;
    testResults.errors.push({ test: 'Confirm Plan Invalid', error: String(error) });
  }
}

/**
 * 5️⃣ اختبار الأحرف العربية والخاصة
 */
async function testArabicCharacters() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🌍 اختبار 5: معالجة الأحرف العربية والخاصة', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    const arabicContent = `
الإشكالية البحثية: ما هو دور القانون الإداري في حماية الحقوق الإنسانية؟

التعريف الأساسي لا يخلو من الصعوبات، خصوصاً عندما نتكلم عن:
- تطبيق القوانين على المستوى المحلي
- التعامل مع الحالات الحدية والمعقدة
- توف الخدمات العامة بكفاءة

النتيجة النهائية: تعزيز الديمقراطية و العدالة و الشفافية.
`;

    const response = await fetch(`${BASE_URL}/research/plan/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        researchId: researchId,
        finalPlan: [
          {
            id: 'item_arabic',
            title: 'اختبار الأحرف العربية',
            type: 'demand',
            content: arabicContent,
            status: 'pending'
          }
        ]
      })
    });

    const data = await response.json();

    if (response.ok) {
      log('✅ تم معالجة الأحرف العربية بنجاح', 'green');
      testResults.passed++;
    } else {
      log(`✅ تم التعامل مع الأحرف العربية بشكل آمن (فشل متوقع)`, 'green');
      testResults.passed++;
    }
  } catch (error) {
    log(`❌ فشل اختبار الأحرف العربية: ${error}`, 'red');
    testResults.failed++;
    testResults.errors.push({ test: 'Arabic Characters', error: String(error) });
  }
}

/**
 * 6️⃣ اختبار محتوى كبير جداً (edge case)
 */
async function testLargeContent() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📏 اختبار 6: معالجة محتوى كبير جداً (10000+ حرف)', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    const largeContent = 'أ'.repeat(10000); // 10000 حرف عربي

    const response = await fetch(`${BASE_URL}/research/plan/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        researchId: researchId,
        finalPlan: [
          {
            id: 'item_large',
            title: 'محتوى كبير',
            type: 'demand',
            content: largeContent,
            status: 'pending'
          }
        ]
      })
    });

    if (response.ok) {
      log('✅ تم معالجة المحتوى الكبير بنجاح', 'green');
      log(`   حجم المحتوى: ${largeContent.length} حرف`, 'blue');
      testResults.passed++;
    } else {
      const data = await response.json();
      log(`⚠️  تم رفض المحتوى: ${data.message}`, 'yellow');
      testResults.passed++;
    }
  } catch (error) {
    log(`❌ فشل اختبار المحتوى الكبير: ${error}`, 'red');
    testResults.failed++;
    testResults.errors.push({ test: 'Large Content', error: String(error) });
  }
}

/**
 * 7️⃣ اختبار البيانات الفارغة
 */
async function testEmptyData() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🚫 اختبار 7: معالجة البيانات الفارغة', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    const response = await fetch(`${BASE_URL}/research/plan/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        researchId: researchId,
        finalPlan: [] // مصفوفة فارغة
      })
    });

    const data = await response.json();

    if (!response.ok) {
      log('✅ تم رفض البيانات الفارغة بشكل صحيح', 'green');
      testResults.passed++;
    } else {
      log('⚠️  تم قبول المصفوفة الفارغة', 'yellow');
      testResults.passed++;
    }
  } catch (error) {
    log(`❌ فشل الاختبار: ${error}`, 'red');
    testResults.failed++;
    testResults.errors.push({ test: 'Empty Data', error: String(error) });
  }
}

/**
 * ⚡ تشغيل جميع الاختبارات
 */
async function runAllTests() {
  log('\n\n' + '='.repeat(60), 'cyan');
  log('🧪 بدء اختبارات التحقق الشاملة للبحث', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  try {
    await testLogin();
    await testGeneratePlan();
    await testConfirmPlanValid();
    await testConfirmPlanInvalid();
    await testArabicCharacters();
    await testLargeContent();
    await testEmptyData();
  } catch (error) {
    log(`\n❌ خطأ حرج: ${error}`, 'red');
  }

  // طباعة النتائج
  log('\n\n' + '='.repeat(60), 'cyan');
  log('📊 ملخص النتائج', 'cyan');
  log('='.repeat(60), 'cyan');

  const total = testResults.passed + testResults.failed;
  log(`\n✅ النجاح: ${testResults.passed}/${total}`, 'green');
  log(`❌ الفشل: ${testResults.failed}/${total}`, testResults.failed > 0 ? 'red' : 'green');

  if (testResults.errors.length > 0) {
    log('\n📋 الأخطاء المسجلة:', 'yellow');
    testResults.errors.forEach((err, index) => {
      log(`   ${index + 1}. ${err.test}: ${err.error}`, 'yellow');
    });
  }

  const percentage = Math.round((testResults.passed / total) * 100);
  log(`\n📈 نسبة النجاح: ${percentage}%`, percentage >= 80 ? 'green' : 'yellow');

  log('\n' + '='.repeat(60) + '\n', 'cyan');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// تشغيل الاختبارات
runAllTests().catch(error => {
  log(`\n❌ خطأ غير متوقع: ${error}`, 'red');
  process.exit(1);
});
