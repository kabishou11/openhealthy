// Database seed script - Populates initial data
import { db, initializeDatabase } from '../models/db.js';
import { hashPassword, generateId } from '../auth/jwt.js';

async function seed() {
  console.log('🌱 Starting database seed...\n');

  initializeDatabase();

  // Create demo school
  const schoolId = generateId();
  db.prepare(`
    INSERT INTO schools (id, name, type, address, contact_phone, nutrition_standard, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    schoolId,
    '阳光中学',
    'MIDDLE',
    '北京市海淀区阳光路100号',
    '010-88888888',
    JSON.stringify({
      calories: 650,
      protein: 25,
      fat: 20,
      sodium: 900,
    })
  );
  console.log('✅ Created demo school: 阳光中学');

  // Create demo cafeteria
  const cafeteriaId = generateId();
  db.prepare(`
    INSERT INTO cafeterias (id, school_id, name, type, capacity, opening_hours, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    cafeteriaId,
    schoolId,
    '第一食堂',
    'STANDARD',
    1000,
    JSON.stringify({
      breakfast: '6:30-9:00',
      lunch: '11:00-13:00',
      dinner: '17:00-20:00',
    })
  );
  console.log('✅ Created demo cafeteria: 第一食堂');

  // Create demo classes
  const classes = [
    { name: '一年级一班', grade: '高一' },
    { name: '一年级二班', grade: '高一' },
    { name: '二年级一班', grade: '高二' },
  ];

  const classIds: string[] = [];
  for (const cls of classes) {
    const classId = generateId();
    db.prepare(`
      INSERT INTO classes (id, school_id, name, grade, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(classId, schoolId, cls.name, cls.grade);
    classIds.push(classId);
  }
  console.log(`✅ Created ${classes.length} demo classes`);

  // Create demo parent user
  const parentId = generateId();
  const parentPassword = await hashPassword('123456');
  db.prepare(`
    INSERT INTO users (id, phone, password, role, name, avatar, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(parentId, '13800138000', parentPassword, 'PARENT', '张爸爸', null);
  console.log('✅ Created demo parent user: 13800138000 / 123456');

  // Create demo student linked to parent
  const studentId = generateId();
  db.prepare(`
    INSERT INTO students (
      id, user_id, school_id, class_id, student_id, name, gender, birth_date,
      height, weight, bmi, vision_left, vision_right, allergies, conditions,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
  `).run(
    studentId,
    parentId,
    schoolId,
    classIds[0],
    '2024001',
    '张小明',
    'MALE',
    '2010-05-15',
    165,  // height
    55,    // weight
    20.2,  // bmi
    1.0,   // vision left
    1.2,   // vision right
    JSON.stringify(['虾', '花生']),
    JSON.stringify([])
  );
  console.log('✅ Created demo student: 张小明');

  // Create special diet for student
  const dietId = generateId();
  db.prepare(`
    INSERT INTO special_diets (id, student_id, type, detail, severity, start_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'))
  `).run(dietId, studentId, 'ALLERGY', '虾,花生', 'PROHIBIT', '2024-01-01');
  console.log('✅ Created special diet: 虾、花生过敏');

  // Create sample dishes from HowToCook
  const sampleDishes = [
    { name: '番茄炒蛋', category: 'MEAT', calories: 150, protein: 12, carbs: 8, fat: 9 },
    { name: '红烧茄子', category: 'VEGETABLE', calories: 120, protein: 5, carbs: 15, fat: 6 },
    { name: '宫保鸡丁', category: 'MEAT', calories: 200, protein: 18, carbs: 12, fat: 10 },
    { name: '清炒时蔬', category: 'VEGETABLE', calories: 80, protein: 4, carbs: 10, fat: 3 },
    { name: '紫菜蛋花汤', category: 'SOUP', calories: 60, protein: 5, carbs: 3, fat: 4 },
    { name: '蒸蛋羹', category: 'MEAT', calories: 100, protein: 8, carbs: 2, fat: 7 },
    { name: '凉拌黄瓜', category: 'VEGETABLE', calories: 50, protein: 2, carbs: 6, fat: 2 },
    { name: '白米饭', category: 'STAPLE', calories: 200, protein: 4, carbs: 45, fat: 0.5 },
    { name: '糙米饭', category: 'STAPLE', calories: 180, protein: 5, carbs: 38, fat: 2 },
    { name: '牛奶燕麦粥', category: 'BREAKFAST', calories: 150, protein: 6, carbs: 25, fat: 3 },
  ];

  for (const dish of sampleDishes) {
    const dishId = generateId();
    db.prepare(`
      INSERT INTO dishes (
        id, cafeteria_id, name, category, difficulty, cooking_time,
        price, nutrition, allergens, contraindications,
        is_available, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).run(
      dishId,
      cafeteriaId,
      dish.name,
      dish.category,
      'EASY',
      20,
      5,
      JSON.stringify({
        calories: dish.calories,
        protein: dish.protein,
        carbs: dish.carbs,
        fat: dish.fat,
      }),
      JSON.stringify([]),
      JSON.stringify([])
    );
  }
  console.log(`✅ Created ${sampleDishes.length} sample dishes`);

  // Create daily menu for today
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = weekDays[dayOfWeek];

  const menuId = generateId();
  db.prepare(`
    INSERT INTO daily_menus (
      id, cafeteria_id, date, week_day, meals, total_nutrition,
      status, published_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'PUBLISHED', datetime('now'), datetime('now'), datetime('now'))
  `).run(
    menuId,
    cafeteriaId,
    today,
    dayOfWeek,
    JSON.stringify({
      breakfast: [{ name: '牛奶燕麦粥', portion: '1份' }],
      lunch: [
        { name: '番茄炒蛋', portion: '1份' },
        { name: '红烧茄子', portion: '1份' },
        { name: '白米饭', portion: '1份' },
      ],
      dinner: [
        { name: '宫保鸡丁', portion: '1份' },
        { name: '清炒时蔬', portion: '1份' },
        { name: '糙米饭', portion: '1份' },
      ],
    }),
    JSON.stringify({
      calories: 850,
      protein: 35,
      carbs: 110,
      fat: 28,
    })
  );
  console.log('✅ Created daily menu for today');

  // Create sample knowledge chunks
  const knowledgeChunks = [
    {
      category: 'nutrition',
      title: '学生营养标准',
      content: '中学生每日应摄入热量约1800-2200千卡，蛋白质60-80克，脂肪50-70克。早餐应提供全天能量的25-30%，午餐35-40%，晚餐30-35%。',
      tags: ['学生', '营养标准', '热量'],
    },
    {
      category: 'nutrition',
      title: '蛋白质的作用',
      content: '蛋白质是构成人体组织的基本物质，参与酶、激素、抗体等的合成。学生正处于生长发育期，充足的蛋白质摄入对身高增长和智力发育至关重要。',
      tags: ['蛋白质', '生长发育'],
    },
    {
      category: 'diet_therapy',
      title: '食物过敏饮食建议',
      content: '对虾、蟹等甲壳类海鲜过敏的学生应严格避免食用相关食物。学校食堂应提供替代菜品，确保营养均衡。',
      tags: ['过敏', '海鲜', '替代方案'],
    },
    {
      category: 'disease',
      title: '近视防控饮食',
      content: '富含维生素A的食物有助于保护视力，如胡萝卜、菠菜、动物肝脏等。同时应注意补充叶黄素，少吃甜食。',
      tags: ['近视', '维生素A', '护眼'],
    },
  ];

  for (const chunk of knowledgeChunks) {
    const chunkId = generateId();
    db.prepare(`
      INSERT INTO knowledge_chunks (id, category, title, content, tags, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(chunkId, chunk.category, chunk.title, chunk.content, JSON.stringify(chunk.tags));
  }
  console.log(`✅ Created ${knowledgeChunks.length} knowledge chunks`);

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('Demo accounts:');
  console.log('  Parent: 13800138000 / 123456');
}

seed().catch(console.error);
