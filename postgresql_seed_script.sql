-- ================================================================
-- PostgreSQL Database Seed Script - Ecobank Ellevate Challenge Edition
-- ================================================================
-- Generated: 2025-06-23 13:54:00
-- Purpose: Seed all tables except users table with Ellevate Challenge content
-- User ID: user_2yiv3w14KpB9wlDb0EoPANJKsmG
-- MUX Asset ID: Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc
--
-- Tables seeded:
-- - courses (3 records)
-- - lessons (12 records)
-- - questions (29 questions)
-- - enrollments (2 records)
-- - lesson_progress (7 records)
-- - question_progress (15 records)
-- - tickets (3 records)
-- - ticket_responses (2 records)
--
-- Prerequisites:
-- - User with ID 'user_2yiv3w14KpB9wlDb0EoPANJKsmG' must exist in users table
-- - All enum types must be created (lesson_status, ticket_type, ticket_status, ticket_priority)
--
-- Usage:
-- psql -d your_database -f postgresql_seed_script.sql
-- ================================================================

BEGIN;

-- PostgreSQL Seed Script
-- Generated for Ecobank Ellevate Challenge course management system
-- Note: This script assumes the user table already has the specified user

-- Disable triggers temporarily for faster inserts
SET session_replication_role = replica;

-- Insert Courses
INSERT INTO courses (
id, title, description, instructor_id, instructor_name, instructor_avatar_url,
course_level, tags, status, price, discount, image_url, is_certified,
length, lessons_count, enrollments_count, created_at, updated_at
) VALUES (
'67d39f26-3dd9-4587-99c8-55039ab354c6',
'Leadership Excellence for African Women Entrepreneurs',
'Develop essential leadership skills tailored for African women-led businesses. Master resilience, team building, and strategic thinking to drive business growth and community impact across Africa.',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'Josephine Anan-Ankomah',
'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?fit=facearea&facepad=2&w=400&h=400&q=80',
'BEGINNER',
'["leadership","women-entrepreneurs","africa","business-growth"]',
'PUBLISHED',
0,
0,
'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=600&h=400&q=80',
true,
6300,
3,
1,
NOW(),
NOW()
);

INSERT INTO courses (
id, title, description, instructor_id, instructor_name, instructor_avatar_url,
course_level, tags, status, price, discount, image_url, is_certified,
length, lessons_count, enrollments_count, created_at, updated_at
) VALUES (
'4cf5bff5-fdcf-4b75-aa52-d243d0b6c51a',
'Digital Finance & Business Scaling for SMEs',
'Master digital banking, mobile payments, and financial inclusion tools. Learn to leverage Ecobank solutions and digital platforms to access markets and scale your business across African borders.',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'Carol Oyedeji',
'https://images.unsplash.com/photo-1580489944761-15a19d654956?fit=facearea&facepad=2&w=400&h=400&q=80',
'ADVANCED',
'["digital-finance","mobile-banking","business-scaling","ecobank"]',
'PUBLISHED',
0,
0,
'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?fit=crop&w=600&h=400&q=80',
true,
9000,
4,
1,
NOW(),
NOW()
);

INSERT INTO courses (
id, title, description, instructor_id, instructor_name, instructor_avatar_url,
course_level, tags, status, price, discount, image_url, is_certified,
length, lessons_count, enrollments_count, created_at, updated_at
) VALUES (
'86898574-6281-48e1-a6e9-6d72b0a17ba5',
'Agricultural Export Readiness & AfCFTA Market Access',
'Navigate the African Continental Free Trade Area opportunities. Learn export preparation, cross-border logistics, and market entry strategies to expand your agricultural business across Africa.',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'Rose Goslinga',
'https://images.unsplash.com/photo-1494790108755-2616c4e5bb17?fit=facearea&facepad=2&w=400&h=400&q=80',
'INTERMEDIATE',
'["export","afcfta","agriculture","market-access","trade"]',
'PUBLISHED',
0,
0,
'https://images.unsplash.com/photo-1500595046743-cd271d694d30?fit=crop&w=600&h=400&q=80',
false,
12000,
5,
0,
NOW(),
NOW()
);

-- Insert Lessons
INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'bfc56ea8-d5e0-4d8f-94d2-750b4cdc519c',
'67d39f26-3dd9-4587-99c8-55039ab354c6',
'Foundational Leadership Principles for African Women',
'Discover the unique leadership challenges and opportunities for women entrepreneurs in Africa. Learn about authentic leadership styles and building confidence in male-dominated industries.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
1800,
'["leadership-foundations.pdf","african-women-leaders-case-studies.pdf"]',
'["https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1552664730-d307ca884978?fit=crop&w=800&h=600&q=80"]',
1,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'3143479b-eb04-47c9-91e1-b9c74b6fd646',
'67d39f26-3dd9-4587-99c8-55039ab354c6',
'Building Resilient Teams and Managing Challenges',
'Master the art of team building in diverse African business environments. Learn conflict resolution, motivation techniques, and how to turn challenges into growth opportunities.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
2100,
'["team-building-strategies.pdf","conflict-resolution-guide.pdf"]',
'["https://images.unsplash.com/photo-1552664688-cf412ec27db2?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?fit=crop&w=800&h=600&q=80"]',
2,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'cb047a98-bf9f-4b33-bcca-bd4caaaf43c8',
'67d39f26-3dd9-4587-99c8-55039ab354c6',
'Strategic Growth Planning and Community Impact',
'Develop comprehensive business growth strategies while creating positive community impact. Learn to balance profit with purpose and build sustainable enterprises.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
2400,
'["strategic-planning-workbook.pdf","community-impact-metrics.pdf"]',
'["https://images.unsplash.com/photo-1560472355-536de3962603?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1521737604893-d14cc237f11d?fit=crop&w=800&h=600&q=80"]',
3,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'ca0d643d-387f-45e6-b6a3-1100f730ecc5',
'4cf5bff5-fdcf-4b75-aa52-d243d0b6c51a',
'Digital Banking Fundamentals with Ecobank Solutions',
'Master digital banking basics and explore Ecobank''s Ellevate program benefits. Learn about mobile banking, digital wallets, and accessing financial services across 33 African countries.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
1800,
'["ecobank-digital-guide.pdf","mobile-banking-setup.pdf"]',
'["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1563013544-824ae1b704d3?fit=crop&w=800&h=600&q=80"]',
1,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'bed8181c-ef75-4a13-b4e1-668d8c777a98',
'4cf5bff5-fdcf-4b75-aa52-d243d0b6c51a',
'Mobile Payments and Cross-Border Transactions',
'Learn to process payments instantly across Africa using mobile money and digital platforms. Master EcobankPay, Omni Lite, and other cross-border payment solutions.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
2100,
'["mobile-payments-manual.pdf","cross-border-transaction-guide.pdf"]',
'["https://images.unsplash.com/photo-1556742111-a301076d9d18?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1565688534245-05d6b5be184a?fit=crop&w=800&h=600&q=80"]',
2,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'5e02eb68-8312-415c-b6ed-d794f23191e7',
'4cf5bff5-fdcf-4b75-aa52-d243d0b6c51a',
'E-commerce Platforms and Digital Marketplaces',
'Build your online presence and reach customers across Africa. Learn to use digital marketplaces, social commerce, and e-commerce platforms to expand your market reach.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
2400,
'["ecommerce-setup-guide.pdf","digital-marketing-strategies.pdf"]',
'["https://images.unsplash.com/photo-1556742044-3c52d6e88c62?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1563013544-824ae1b704d3?fit=crop&w=800&h=600&q=80"]',
3,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'd3d0fb45-6369-4aaf-bff4-85a27dfd27bb',
'4cf5bff5-fdcf-4b75-aa52-d243d0b6c51a',
'Accessing Credit and Investment Opportunities',
'Navigate Ecobank''s lending solutions for women entrepreneurs. Learn about collateral-free loans, investment funds, and building creditworthiness for business growth.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
2700,
'["credit-access-guide.pdf","investment-readiness-checklist.pdf"]',
'["https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1450101499163-c8848c66ca85?fit=crop&w=800&h=600&q=80"]',
4,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'0bfffb3b-4930-4bf8-a5e5-51c4ec562622',
'86898574-6281-48e1-a6e9-6d72b0a17ba5',
'Understanding AfCFTA and Continental Trade Opportunities',
'Master the African Continental Free Trade Area protocols and identify opportunities for your agricultural business. Learn about tariff reductions and market access benefits.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
1800,
'["afcfta-overview.pdf","trade-opportunities-map.pdf"]',
'["https://images.unsplash.com/photo-1500595046743-cd271d694d30?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&h=600&q=80"]',
1,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'd3aeb14a-e305-4d01-9d55-5c7ea174891f',
'86898574-6281-48e1-a6e9-6d72b0a17ba5',
'Export Documentation and Compliance Requirements',
'Navigate export paperwork, certifications, and compliance requirements for African markets. Master the documentation process to avoid delays and penalties.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
2100,
'["export-documentation-checklist.pdf","compliance-requirements.pdf"]',
'["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=800&h=600&q=80"]',
2,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'ca1262ef-9514-44d4-b886-410a32a3ec23',
'86898574-6281-48e1-a6e9-6d72b0a17ba5',
'Market Research and Customer Identification',
'Conduct effective market research to identify target customers across African markets. Learn consumer behavior analysis and competitive positioning strategies.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
2400,
'["market-research-toolkit.pdf","customer-profiling-templates.pdf"]',
'["https://images.unsplash.com/photo-1460925895917-afdab827c52f?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=800&h=600&q=80"]',
3,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'1bc2b8a3-ab91-4b09-b822-3e69fe31cf30',
'86898574-6281-48e1-a6e9-6d72b0a17ba5',
'Logistics and Supply Chain Management',
'Master cross-border logistics, cold chain management, and distribution networks. Learn to optimize supply chains for agricultural products across African markets.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
2700,
'["logistics-planning-guide.pdf","supply-chain-optimization.pdf"]',
'["https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1494412651409-8963ce7935a7?fit=crop&w=800&h=600&q=80"]',
4,
true,
NOW(),
NOW()
);

INSERT INTO lessons (
id, course_id, title, description, video_url, duration, files, gallery,
"order", has_questions, created_at, updated_at
) VALUES (
'a6b0316b-bc88-4a0b-9813-4073302b69e6',
'86898574-6281-48e1-a6e9-6d72b0a17ba5',
'Quality Standards and Value Addition Strategies',
'Implement international quality standards and value-addition techniques. Learn about certifications, processing, and packaging to meet export market demands.',
'Aphvz00bQ02i99dM6A5Q2zsdFc002POGfSVhvcvUeKVpKc',
3000,
'["quality-standards-manual.pdf","value-addition-strategies.pdf"]',
'["https://images.unsplash.com/photo-1516321497487-e288fb19713f?fit=crop&w=800&h=600&q=80","https://images.unsplash.com/photo-1542838132-92c53300491e?fit=crop&w=800&h=600&q=80"]',
5,
true,
NOW(),
NOW()
);

-- Insert Questions
INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'1db9a24c-dcd1-4fdf-b1d1-caadad8ce28f',
'bfc56ea8-d5e0-4d8f-94d2-750b4cdc519c',
'What is a key challenge facing African women entrepreneurs according to the lesson?',
'[{"id":"efd959e6-30b9-4138-a292-8eaac7f53c5b","text":"Limited access to finance and capital","isCorrect":true},{"id":"b1b00433-7cf7-460b-95bf-8a1adffb2a9d","text":"Too many business opportunities","isCorrect":false},{"id":"2bf51417-e3a1-4b81-890a-78d96e52a026","text":"Excessive government support","isCorrect":false},{"id":"6b48acc8-54f2-495d-be1b-fe2169328ccc","text":"Overrepresentation in leadership roles","isCorrect":false}]',
1,
'Limited access to finance is identified as one of the primary barriers facing African women entrepreneurs, with a $42 billion financing gap documented by the African Development Bank.',
'["Think about the financial barriers discussed in the lesson","Consider the statistics about women-owned SMEs in Africa"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'79b37179-934c-4854-8850-66b6cd93a86b',
'bfc56ea8-d5e0-4d8f-94d2-750b4cdc519c',
'Which leadership style is most effective for African women entrepreneurs?',
'[{"id":"1f9e127c-0601-4be8-ba08-8fad9c3c9d9c","text":"Authoritarian leadership only","isCorrect":false},{"id":"edc49cfd-c8ce-4b10-94cb-5b50746a9003","text":"Authentic and collaborative leadership","isCorrect":true},{"id":"f2a8cf56-9528-4623-8755-c91e32a3e893","text":"Passive leadership approach","isCorrect":false},{"id":"03fc9b5f-e2d6-4032-a0e2-e0b517de7153","text":"Micromanagement style","isCorrect":false}]',
2,
'Authentic and collaborative leadership styles are most effective as they leverage cultural values and build trust in diverse African business environments.',
'["Consider the cultural context of African business environments","Think about leadership approaches that build trust and collaboration"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'67f6404b-785e-47e1-90a6-cde5ae5a6a99',
'3143479b-eb04-47c9-91e1-b9c74b6fd646',
'What is the first step in building a resilient team?',
'[{"id":"0e46ea98-ab92-40be-9380-c0993d194d84","text":"Establishing clear communication channels and trust","isCorrect":true},{"id":"0ca2017a-be01-4a63-8bfb-d61ad3481852","text":"Hiring only experienced professionals","isCorrect":false},{"id":"ce84c1da-5898-4e91-abff-f06388193492","text":"Avoiding difficult conversations","isCorrect":false},{"id":"64421ba8-31f6-4e72-81a4-d6b9ae7826ca","text":"Focusing solely on individual performance","isCorrect":false}]',
1,
'Clear communication and trust form the foundation of resilient teams, enabling effective collaboration and problem-solving.',
'["Think about the fundamentals of team dynamics","Consider what enables teams to work effectively together"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'16ba220b-201b-4dea-ae05-8035f7e225af',
'3143479b-eb04-47c9-91e1-b9c74b6fd646',
'How should conflicts be addressed in African business contexts?',
'[{"id":"9e43320a-e25b-472b-a0e9-afe36b49d3cf","text":"Ignore them and hope they resolve","isCorrect":false},{"id":"8bddf0e7-0e6b-4cde-a6c0-92269a24150a","text":"Address promptly with cultural sensitivity","isCorrect":true},{"id":"e89a5907-2b67-4106-ade7-afb094857415","text":"Use only formal disciplinary measures","isCorrect":false},{"id":"6b9502ee-d577-4e94-939f-b22a238cfe14","text":"Let team members resolve alone","isCorrect":false}]',
2,
'Conflicts should be addressed promptly while considering cultural sensitivities and traditional conflict resolution approaches.',
'["Consider the importance of cultural context in African business","Think about proactive vs reactive approaches to conflict"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'db5e5512-0769-4947-935f-ba2571655620',
'3143479b-eb04-47c9-91e1-b9c74b6fd646',
'What motivates high performance in diverse African teams?',
'[{"id":"68066bac-cb3b-4c97-8a8b-0f09db4c73d7","text":"Only financial incentives","isCorrect":false},{"id":"683d6be9-f217-4e5b-bc4d-ceeea9c93085","text":"Only individual recognition","isCorrect":false},{"id":"2049f150-a685-43e3-8d79-20fe5c6c2e3b","text":"Only competitive pressure","isCorrect":false},{"id":"e9d87143-cd5e-4dd5-9421-4daa209313d5","text":"Purpose-driven goals and community impact","isCorrect":true}]',
3,
'Purpose-driven goals that connect to community impact and shared values are powerful motivators in African business contexts.',
'["Think about what drives motivation beyond financial rewards","Consider the importance of purpose and community in African cultures"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'1618331f-30a9-4165-8e8c-4191952c43fb',
'cb047a98-bf9f-4b33-bcca-bd4caaaf43c8',
'What is the key to sustainable business growth?',
'[{"id":"31bcf60c-959c-42bb-9a13-7f43b063b58e","text":"Balancing profit with social impact","isCorrect":true},{"id":"94ca9238-04ce-4481-8736-62147e1dc42b","text":"Maximizing short-term profits only","isCorrect":false},{"id":"788080c8-d0d5-42ea-a579-4148f806678d","text":"Avoiding community engagement","isCorrect":false},{"id":"caa8803e-e705-48f6-9f6a-944730175bad","text":"Focusing solely on individual gain","isCorrect":false}]',
1,
'Sustainable growth requires balancing financial success with positive social and community impact, creating long-term value.',
'["Consider what makes businesses truly sustainable long-term","Think about the role of social impact in business success"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'871f9a27-0ee3-46d3-9249-6201f09fe189',
'cb047a98-bf9f-4b33-bcca-bd4caaaf43c8',
'How should community impact be measured?',
'[{"id":"2b93fb24-3e0b-4358-a5cb-3183c803f239","text":"Only through financial donations","isCorrect":false},{"id":"e36e1c4d-e9be-4902-ac36-997dc364b495","text":"Through jobs created and skills development","isCorrect":true},{"id":"1a6965f2-357e-4466-83fb-ab2ea167e104","text":"Through media coverage only","isCorrect":false},{"id":"b8f21908-20c1-4edd-b851-d8909ba9a16b","text":"Through business awards received","isCorrect":false}]',
2,
'Community impact is best measured through tangible outcomes like job creation, skills development, and capacity building.',
'["Think about concrete ways businesses can benefit communities","Consider measurable outcomes that create lasting change"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'44ecdb0b-88d9-4963-ab43-f50fdef90713',
'ca0d643d-387f-45e6-b6a3-1100f730ecc5',
'What is a key benefit of Ecobank''s Ellevate program?',
'[{"id":"fcb814fa-63bb-416a-a672-88e24576c5d4","text":"Access to loans up to $50,000 and cross-border banking","isCorrect":true},{"id":"2732ce52-c141-4c8c-a5e8-06696be75a87","text":"Free business equipment","isCorrect":false},{"id":"4a29626f-6fd7-4b25-9fdb-72b8bd3e0bfb","text":"Guaranteed business success","isCorrect":false},{"id":"6ba13131-ce5b-49c2-8048-43583bd13e43","text":"Automatic loan approval","isCorrect":false}]',
1,
'Ecobank''s Ellevate program offers unsecured loans up to $50,000 and banking services across 33 African countries.',
'["Review the specific benefits of the Ellevate program mentioned in the lesson","Think about financial services that support women entrepreneurs"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'7310f18f-e341-4850-b391-179100ff1180',
'ca0d643d-387f-45e6-b6a3-1100f730ecc5',
'How many African countries does Ecobank operate in?',
'[{"id":"3c3f05c2-b7f5-4f73-b56a-f8d142e670ae","text":"25 countries","isCorrect":false},{"id":"46b68ad8-a5f3-4143-89ea-0c7bd3250c9c","text":"33 countries","isCorrect":true},{"id":"6d09ebe3-0c6e-4939-920b-75be3719bebd","text":"40 countries","isCorrect":false},{"id":"fc0daeb0-82d2-46a2-8e55-b69919467935","text":"20 countries","isCorrect":false}]',
2,
'Ecobank operates across 33 African countries, making it the most widespread pan-African bank.',
'["Recall the geographic coverage mentioned in the lesson","Think about Ecobank''s pan-African presence"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'5675572d-5b64-488a-82df-514c674a8360',
'bed8181c-ef75-4a13-b4e1-668d8c777a98',
'What is EcobankPay designed for?',
'[{"id":"b3ef15b8-dac9-491f-bc74-44b9e6f4b6c9","text":"Instant cross-border payments across Africa","isCorrect":true},{"id":"21ebb105-40f3-4bff-bb8f-d6d67ef53177","text":"Only domestic transactions","isCorrect":false},{"id":"214ad0ef-d324-4f11-8bbc-8f48778e2f04","text":"Investment management only","isCorrect":false},{"id":"5d2fc7bc-54c7-4afd-b5c0-9b139ee5197b","text":"Traditional bank transfers only","isCorrect":false}]',
1,
'EcobankPay enables instant payments across African borders, facilitating cross-border trade and commerce.',
'["Think about the cross-border capabilities mentioned","Consider what makes EcobankPay different from traditional banking"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'4a4e17a1-41db-4501-9822-8416b2c2bdcb',
'bed8181c-ef75-4a13-b4e1-668d8c777a98',
'Why is mobile money important for African businesses?',
'[{"id":"4d935632-d083-43b5-aff8-5f96279dee53","text":"It''s only for personal use","isCorrect":false},{"id":"1381abec-e990-4d39-8843-bc6986334499","text":"It increases financial inclusion and reduces transaction costs","isCorrect":true},{"id":"859fcc03-0d52-4fcd-959e-580c71e2ca96","text":"It replaces all other payment methods","isCorrect":false},{"id":"c582239c-f184-44c1-9d39-697e88a96fb3","text":"It''s only for large corporations","isCorrect":false}]',
2,
'Mobile money increases financial inclusion, especially for underserved populations, and reduces transaction costs significantly.',
'["Consider the benefits of mobile money for financial inclusion","Think about cost and accessibility advantages"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'aeb9f944-abc9-4db3-aa13-138908301ca9',
'bed8181c-ef75-4a13-b4e1-668d8c777a98',
'What percentage of Africa''s cross-border payments market is projected by 2035?',
'[{"id":"3d54cd19-e937-4b64-a5d7-378ecd0513f8","text":"$500 billion","isCorrect":false},{"id":"2156fee4-d128-4545-9b3a-9c775b173e57","text":"$750 billion","isCorrect":false},{"id":"cdb8d3df-296e-4313-a05c-35b647f7aa40","text":"$1 trillion","isCorrect":true},{"id":"1dadb183-db77-424f-8457-c892652c7363","text":"$1.5 trillion","isCorrect":false}]',
3,
'Africa''s cross-border payments market is projected to reach $1 trillion by 2035, showing massive growth potential.',
'["Recall the market projection figures mentioned in the lesson","Think about the growth trajectory of African payments"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'1cfe5a88-b387-45fa-967f-a0725aa7446f',
'5e02eb68-8312-415c-b6ed-d794f23191e7',
'What is the primary advantage of e-commerce for African businesses?',
'[{"id":"717ee3d4-5f15-446b-bcaf-1b0180758e3f","text":"Access to continental and global markets","isCorrect":true},{"id":"24346c08-8c41-49d5-85c4-c0cff39bfbac","text":"Lower product quality requirements","isCorrect":false},{"id":"99e9913a-7221-49db-90e7-3bce7a121355","text":"Reduced customer service needs","isCorrect":false},{"id":"9feae1be-09a9-47ed-a436-2f26c9048eb6","text":"Limited competition","isCorrect":false}]',
1,
'E-commerce enables African businesses to access continental and global markets, breaking geographical barriers.',
'["Think about how e-commerce expands market reach","Consider the geographic advantages of online selling"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'8826a7ef-4289-4680-bacf-cc1fd1c982b6',
'5e02eb68-8312-415c-b6ed-d794f23191e7',
'Which social media platform is most effective for African business marketing?',
'[{"id":"c9a95f0a-4574-4830-ae6a-a49120fc4b0f","text":"Only international platforms","isCorrect":false},{"id":"7d136528-bed7-4d7e-8d98-8f9831417522","text":"WhatsApp Business and Facebook for local engagement","isCorrect":true},{"id":"1dbe4f23-504e-44cf-8bb5-bd6efa5e6938","text":"Only traditional advertising","isCorrect":false},{"id":"609b1955-9276-4491-8d6a-a9ee7e4d1774","text":"Email marketing only","isCorrect":false}]',
2,
'WhatsApp Business and Facebook are highly effective due to high adoption rates and local engagement patterns in Africa.',
'["Consider which platforms have high adoption in Africa","Think about local preferences for communication and business"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'90a9b068-0947-49b3-b271-5904af704cd1',
'd3d0fb45-6369-4aaf-bff4-85a27dfd27bb',
'What is the minimum loan amount available through Ecobank''s enhanced Ellevate program?',
'[{"id":"059b2531-cb06-4aea-a46b-a92ce1f7b99b","text":"Varies based on business needs and creditworthiness","isCorrect":true},{"id":"72e00a05-47c1-4da9-8302-4adfb13556ae","text":"Fixed $10,000 minimum","isCorrect":false},{"id":"ddf1e0a8-d880-4790-8acf-2d2122d888e4","text":"No loans available","isCorrect":false},{"id":"8b0707a4-e05a-45dc-9fec-6dfaaa01e244","text":"Only $50,000 maximum","isCorrect":false}]',
1,
'Ecobank offers flexible loan amounts based on individual business needs and creditworthiness assessment.',
'["Think about how banks typically structure lending","Consider the flexibility mentioned in the Ellevate program"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'af868e8f-8e9d-44f7-afd4-e5f638bd7456',
'd3d0fb45-6369-4aaf-bff4-85a27dfd27bb',
'How much has Ecobank''s Ellevate program disbursed in loans to date?',
'[{"id":"4018680b-109d-4627-a32e-052b4ed2ede5","text":"$100 million","isCorrect":false},{"id":"901f130d-1f23-44b2-b57d-7ed22d95b154","text":"Over $250 million","isCorrect":true},{"id":"5fb80b47-fb9c-41f9-9ae1-f36f32470ca3","text":"$500 million","isCorrect":false},{"id":"915e8a6d-bcb6-4c87-b793-74789fcb29ff","text":"$50 million","isCorrect":false}]',
2,
'Ecobank''s Ellevate program has disbursed over $250 million in loans to women entrepreneurs across Africa.',
'["Recall the disbursement figures mentioned in the lesson","Think about the scale of Ecobank''s commitment to women entrepreneurs"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'3c511a41-d36b-457f-bed1-7fa25ef3af3d',
'd3d0fb45-6369-4aaf-bff4-85a27dfd27bb',
'What is MyTradeHub?',
'[{"id":"f79dd456-05aa-4a07-8d2d-0d554fa148dc","text":"A banking app","isCorrect":false},{"id":"de32ca52-ac40-4527-96ac-d4421a598ae5","text":"A social media platform","isCorrect":false},{"id":"468d38e6-9b2e-4a08-b9db-dcb99f07d3a8","text":"A payment system","isCorrect":false},{"id":"3b0f4cf6-87d9-4049-99b0-48b60aeafe8a","text":"An online matchmaking platform for market access","isCorrect":true}]',
3,
'MyTradeHub is Ecobank''s online matchmaking platform that connects women entrepreneurs with new markets across Africa.',
'["Think about platforms that connect businesses with markets","Consider tools that facilitate trade relationships"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'c23d2aa5-7868-4643-92ef-d75b9c94e4db',
'0bfffb3b-4930-4bf8-a5e5-51c4ec562622',
'What does AfCFTA stand for?',
'[{"id":"98a40329-5bed-4b5e-837d-ef5011acc0eb","text":"African Continental Free Trade Area","isCorrect":true},{"id":"78ea2d82-be73-4063-ac2b-29bd3de5898e","text":"African Commercial Finance Trade Agreement","isCorrect":false},{"id":"40c9a492-4735-41a9-8656-1894355b3425","text":"African Central Free Trading Authority","isCorrect":false},{"id":"e526a9fd-d647-4872-acb3-501c106e2fc3","text":"African Continental Financial Trade Area","isCorrect":false}]',
1,
'AfCFTA stands for African Continental Free Trade Area, the world''s largest free trade area by participating countries.',
'["Break down the acronym letter by letter","Think about continental trade initiatives in Africa"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'6db225fc-dad8-46fe-8a77-97ac82c6e623',
'0bfffb3b-4930-4bf8-a5e5-51c4ec562622',
'How many African countries have signed the AfCFTA agreement?',
'[{"id":"aa051028-730c-40bb-80e0-98e2cf89f0b6","text":"44 countries","isCorrect":false},{"id":"b8be4e0a-e294-4e3d-96e6-0fb8ea8e05dd","text":"48 out of 54 countries","isCorrect":true},{"id":"38737b82-3ed1-4305-a082-5a42901176df","text":"All 54 countries","isCorrect":false},{"id":"44ac25de-8c8b-4b9b-b04e-21aea3070d78","text":"40 countries","isCorrect":false}]',
2,
'48 out of 54 African countries have signed the AfCFTA agreement, with 89% of signatories having ratified it.',
'["Recall the specific numbers mentioned in the lesson","Think about the participation rate in AfCFTA"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'85c18dfe-02f4-4f2b-910f-f9b6bf3a2d3f',
'd3aeb14a-e305-4d01-9d55-5c7ea174891f',
'What is the first step in export documentation?',
'[{"id":"24b4e578-85fb-41fe-ba7c-535227b0cb20","text":"Obtaining the necessary business registration and permits","isCorrect":true},{"id":"9d06ebfa-dec4-4e4e-8e31-3e76d0eb89e3","text":"Shipping the products immediately","isCorrect":false},{"id":"a0839828-58ae-4cb8-9e86-d0384979a270","text":"Finding customers first","isCorrect":false},{"id":"fa85b179-d5b2-4c60-b257-cb506c7234bb","text":"Setting up a warehouse","isCorrect":false}]',
1,
'Proper business registration and export permits are the foundation of legal export operations.',
'["Think about legal requirements for business operations","Consider what authorities need to verify before allowing exports"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'30d4a67f-6a94-43c8-b383-8b51a0d9c661',
'd3aeb14a-e305-4d01-9d55-5c7ea174891f',
'Which certificate is typically required for agricultural exports?',
'[{"id":"4c782231-3621-4561-827a-225448e2a5fb","text":"Only business license","isCorrect":false},{"id":"229da41a-0f54-4f26-983f-9e983b6142d3","text":"Phytosanitary certificate and quality certifications","isCorrect":true},{"id":"1df549b6-5b9f-4982-9b5d-fe6d19835350","text":"Only export license","isCorrect":false},{"id":"ab12069e-f3d5-428b-8189-6326b72c9399","text":"No certificates needed","isCorrect":false}]',
2,
'Phytosanitary certificates ensure plant health and quality certifications verify product standards for agricultural exports.',
'["Think about health and safety requirements for food products","Consider what importing countries need to verify about agricultural products"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'055a3672-963f-4fa6-92b3-4d4e398b7001',
'd3aeb14a-e305-4d01-9d55-5c7ea174891f',
'What happens if export documentation is incomplete?',
'[{"id":"34bc4513-6276-47df-af1d-df5d9fe22d36","text":"Products can be shipped anyway","isCorrect":false},{"id":"01424364-5feb-41cf-9c07-355f1ef8a368","text":"Automatic approval is granted","isCorrect":false},{"id":"1cec5057-e46f-43b1-a0c4-db5bd72d0310","text":"Shipments are delayed or rejected at borders","isCorrect":true},{"id":"6084a8f8-46c1-47e4-bb53-b8cf54dadea7","text":"Documentation can be completed later","isCorrect":false}]',
3,
'Incomplete documentation results in shipment delays, border rejections, and potential financial losses.',
'["Think about border control procedures","Consider the consequences of missing required documents"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'7f797427-b413-4fa2-abe3-ca6726c4c784',
'ca1262ef-9514-44d4-b886-410a32a3ec23',
'What is the first step in market research for African exports?',
'[{"id":"1b8de1f4-01c2-4849-a292-0f4c6a335e69","text":"Identifying target countries and customer segments","isCorrect":true},{"id":"ae18ed93-a518-43bd-b6be-3b17ece86691","text":"Setting prices immediately","isCorrect":false},{"id":"13be1a72-28d0-4c5f-abf9-020e03146766","text":"Launching products everywhere","isCorrect":false},{"id":"2874b0bd-058b-4afa-9216-2dc2843e3881","text":"Waiting for customers to find you","isCorrect":false}]',
1,
'Effective market research starts with identifying specific target countries and understanding customer segments within those markets.',
'["Think about the logical sequence of market research","Consider what you need to know before developing strategies"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'd0225b5c-a16e-45a5-afae-780c596b7ec9',
'ca1262ef-9514-44d4-b886-410a32a3ec23',
'Why is consumer behavior analysis important for African markets?',
'[{"id":"d8119dd6-21b9-4223-814d-0472c7a28c78","text":"It''s not necessary","isCorrect":false},{"id":"7ada5612-9619-4133-a7ea-ef78116dc09c","text":"Different cultures have varying preferences and purchasing patterns","isCorrect":true},{"id":"396b3238-19ab-4669-9c86-670095c939a8","text":"All African markets are identical","isCorrect":false},{"id":"14b0d25c-6594-4b06-b29e-461b9ec2a841","text":"Only price matters","isCorrect":false}]',
2,
'Different African cultures, economies, and regions have varying consumer preferences, purchasing power, and buying patterns.',
'["Think about cultural diversity across Africa","Consider how different economic conditions affect consumer behavior"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'f11b9518-72ca-42c9-8263-9a9b72ae541a',
'1bc2b8a3-ab91-4b09-b822-3e69fe31cf30',
'What is cold chain management?',
'[{"id":"6a75cb42-cae9-4a7a-b4db-b6fe6d76db55","text":"Maintaining temperature-controlled conditions during transport and storage","isCorrect":true},{"id":"b07376b3-6975-4d66-b601-915a1cd1d127","text":"Using only air conditioning","isCorrect":false},{"id":"6bd4fdcb-066d-4f7e-a1fa-3ff4cd9dd645","text":"Storing products in freezers only","isCorrect":false},{"id":"12060bba-4277-4979-8140-469d219a4aae","text":"Shipping only in winter","isCorrect":false}]',
1,
'Cold chain management maintains optimal temperature conditions throughout the supply chain to preserve product quality and safety.',
'["Think about temperature-sensitive agricultural products","Consider the importance of maintaining freshness during transport"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'cf3636ac-cf65-41a9-b3ce-f286c50d364c',
'1bc2b8a3-ab91-4b09-b822-3e69fe31cf30',
'Why is supply chain optimization crucial for African agricultural exports?',
'[{"id":"2e731e00-1be5-49ae-8f25-63293682aa1d","text":"It''s not important","isCorrect":false},{"id":"9d625d35-2257-483f-be75-19a33a5d8bcd","text":"Reduces costs, minimizes losses, and ensures timely delivery","isCorrect":true},{"id":"33e035aa-2ca7-46f8-bea1-f7232feed343","text":"Only affects large companies","isCorrect":false},{"id":"9709794f-32e9-4509-b0da-609ad129ee69","text":"Has no impact on profitability","isCorrect":false}]',
2,
'Optimized supply chains reduce operational costs, minimize product losses, and ensure timely delivery to maintain competitiveness.',
'["Think about the challenges of moving products across Africa","Consider the impact of efficiency on business success"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'92188031-1e5f-42ca-923d-85bff8bd22bf',
'1bc2b8a3-ab91-4b09-b822-3e69fe31cf30',
'What is the biggest logistics challenge for intra-African trade?',
'[{"id":"1a1351f5-f256-4e73-9b1a-fd1996d841dd","text":"Too many options","isCorrect":false},{"id":"12eaa527-f451-41d1-b813-54413fe0524a","text":"Excessive government support","isCorrect":false},{"id":"d80c5c65-fac0-4a74-90f3-124a047f818c","text":"Infrastructure limitations and border delays","isCorrect":true},{"id":"fc82418a-7d7c-4495-9a63-62dbcadc69bd","text":"Low demand for products","isCorrect":false}]',
3,
'Infrastructure limitations, poor road networks, and bureaucratic border delays are major obstacles to efficient intra-African trade.',
'["Think about physical and administrative barriers to trade","Consider infrastructure development needs across Africa"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'94f3f1d1-d90d-4833-b628-5627c2402cab',
'a6b0316b-bc88-4a0b-9813-4073302b69e6',
'Which international standard is most important for agricultural exports?',
'[{"id":"f63c4240-1d0e-4b34-878b-46e3f51f8642","text":"HACCP (Hazard Analysis and Critical Control Points)","isCorrect":true},{"id":"b4a7eb1b-f30c-4e63-85e6-355b98e70369","text":"Only local standards","isCorrect":false},{"id":"0df1a035-adee-4536-a3b3-147e8406b8ca","text":"No standards required","isCorrect":false},{"id":"07149a54-0d4e-411d-903d-67046625092c","text":"ISO standards only","isCorrect":false}]',
1,
'HACCP is crucial for food safety management and is required by most international markets for agricultural exports.',
'["Think about food safety and quality management systems","Consider what international buyers require for food products"]',
NOW(),
NOW(),
false
);

INSERT INTO questions (
id, lesson_id, question_text, answers, "order", explanation, hints,
created_at, updated_at, is_deleted
) VALUES (
'd7cf7529-ada8-4021-b90f-6cf3f8c140f3',
'a6b0316b-bc88-4a0b-9813-4073302b69e6',
'What is value addition in agricultural products?',
'[{"id":"d0febb7d-7095-4cf6-b78a-270745022a01","text":"Increasing prices arbitrarily","isCorrect":false},{"id":"6a50088a-99a8-45d4-b7c8-2e7eb56a8170","text":"Processing, packaging, and branding to increase market value","isCorrect":true},{"id":"28a73276-0992-451e-a276-89aaf5e31ffe","text":"Only changing the packaging","isCorrect":false},{"id":"04ee1b4c-220b-4e17-ba1d-82e8aec19aa7","text":"Selling at higher volumes only","isCorrect":false}]',
2,
'Value addition involves processing, packaging, branding, and quality enhancement to increase the market value and appeal of agricultural products.',
'["Think about how raw products can be transformed","Consider what makes products more attractive to consumers"]',
NOW(),
NOW(),
false
);

-- Insert Enrollments
INSERT INTO enrollments (
id, user_id, course_id, enrolled_at, status, payment_status, progress
) VALUES (
'feb84945-c1a9-4db5-b340-e3407092f1fd',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'67d39f26-3dd9-4587-99c8-55039ab354c6',
NOW(),
'ENROLLED',
'PAID',
60
);

INSERT INTO enrollments (
id, user_id, course_id, enrolled_at, status, payment_status, progress
) VALUES (
'fb83c30a-efc3-4407-ba06-86f0bb6a3eb4',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'4cf5bff5-fdcf-4b75-aa52-d243d0b6c51a',
NOW(),
'COMPLETED',
'PAID',
100
);

-- Insert Lesson Progress
INSERT INTO lesson_progress (
id, user_id, lesson_id, status, content_progress, question_progress,
attempts, time_spent, completed_at, last_accessed_at, created_at, updated_at
) VALUES (
'a8ab2ea9-72c1-497c-adf5-85ace4bdcdc3',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'bfc56ea8-d5e0-4d8f-94d2-750b4cdc519c',
'not_started',
0,
'{"total":3,"completed":0}',
0,
0,
NULL,
NOW(),
NOW(),
NOW()
);

INSERT INTO lesson_progress (
id, user_id, lesson_id, status, content_progress, question_progress,
attempts, time_spent, completed_at, last_accessed_at, created_at, updated_at
) VALUES (
'47212302-30ff-4403-8f96-33e6cfe8c860',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'3143479b-eb04-47c9-91e1-b9c74b6fd646',
'in_progress',
50,
'{"total":3,"completed":1}',
1,
1806,
NULL,
NOW(),
NOW(),
NOW()
);

INSERT INTO lesson_progress (
id, user_id, lesson_id, status, content_progress, question_progress,
attempts, time_spent, completed_at, last_accessed_at, created_at, updated_at
) VALUES (
'9be92555-ede1-494a-94d8-cfcacb9001fa',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'cb047a98-bf9f-4b33-bcca-bd4caaaf43c8',
'in_progress',
50,
'{"total":3,"completed":1}',
1,
3097,
NULL,
NOW(),
NOW(),
NOW()
);

INSERT INTO lesson_progress (
id, user_id, lesson_id, status, content_progress, question_progress,
attempts, time_spent, completed_at, last_accessed_at, created_at, updated_at
) VALUES (
'86bdff71-f3ed-4243-b043-211746eb53df',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'ca0d643d-387f-45e6-b6a3-1100f730ecc5',
'completed',
100,
'{"total":3,"completed":3}',
1,
2575,
'2025-05-23T11:11:37.646228',
NOW(),
NOW(),
NOW()
);

INSERT INTO lesson_progress (
id, user_id, lesson_id, status, content_progress, question_progress,
attempts, time_spent, completed_at, last_accessed_at, created_at, updated_at
) VALUES (
'fec42432-4544-426a-b5c2-06026974fe66',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'bed8181c-ef75-4a13-b4e1-668d8c777a98',
'completed',
100,
'{"total":3,"completed":3}',
1,
1466,
'2025-06-12T11:11:37.646279',
NOW(),
NOW(),
NOW()
);

INSERT INTO lesson_progress (
id, user_id, lesson_id, status, content_progress, question_progress,
attempts, time_spent, completed_at, last_accessed_at, created_at, updated_at
) VALUES (
'322dff3c-6c8c-45d6-a8ba-f1e7283ba54a',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'5e02eb68-8312-415c-b6ed-d794f23191e7',
'completed',
100,
'{"total":3,"completed":3}',
1,
2988,
'2025-06-05T11:11:37.646321',
NOW(),
NOW(),
NOW()
);

INSERT INTO lesson_progress (
id, user_id, lesson_id, status, content_progress, question_progress,
attempts, time_spent, completed_at, last_accessed_at, created_at, updated_at
) VALUES (
'25208727-93b4-4020-abc4-43cd3e6ddb95',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'd3d0fb45-6369-4aaf-bff4-85a27dfd27bb',
'completed',
100,
'{"total":3,"completed":3}',
1,
1598,
'2025-05-23T11:11:37.646362',
NOW(),
NOW(),
NOW()
);

-- Insert Question Progress (keeping original structure with new question IDs)
INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'c83abc57-0bb4-42ac-b34a-379c6a1c81d1',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'67f6404b-785e-47e1-90a6-cde5ae5a6a99',
'0e46ea98-ab92-40be-9380-c0993d194d84',
true,
1,
NULL,
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'5d6efca5-ed91-4b2e-a9f5-f4d9ffad485b',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'16ba220b-201b-4dea-ae05-8035f7e225af',
'e89a5907-2b67-4106-ade7-afb094857415',
false,
1,
NULL,
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'877465ea-7541-42e4-872a-8f36ade88e98',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'db5e5512-0769-4947-935f-ba2571655620',
'683d6be9-f217-4e5b-bc4d-ceeea9c93085',
false,
1,
NULL,
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'90ea3d44-0c93-4c54-a7da-ff6e5a5c2237',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'1618331f-30a9-4165-8e8c-4191952c43fb',
'31bcf60c-959c-42bb-9a13-7f43b063b58e',
true,
1,
NULL,
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'571b2cce-a377-434a-8541-e2b2bf442629',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'871f9a27-0ee3-46d3-9249-6201f09fe189',
'2b93fb24-3e0b-4358-a5cb-3183c803f239',
false,
1,
NULL,
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'b7f3162e-53cd-48ca-afe4-763328d2b43b',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'44ecdb0b-88d9-4963-ab43-f50fdef90713',
'4a29626f-6fd7-4b25-9fdb-72b8bd3e0bfb',
false,
1,
'2025-06-17 11:11:37.647560',
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'b3eb49b0-065d-4684-983c-0774209d9a4c',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'7310f18f-e341-4850-b391-179100ff1180',
'6d09ebe3-0c6e-4939-920b-75be3719bebd',
false,
1,
'2025-06-06 11:11:37.647579',
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'aea24f01-0da6-4ad2-b3f1-bf4f8afbe602',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'5675572d-5b64-488a-82df-514c674a8360',
'5d2fc7bc-54c7-4afd-b5c0-9b139ee5197b',
false,
1,
'2025-06-18 11:11:37.647597',
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'86dd664a-aeac-4202-9a88-8c25acb8c448',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'4a4e17a1-41db-4501-9822-8416b2c2bdcb',
'4d935632-d083-43b5-aff8-5f96279dee53',
false,
1,
'2025-05-30 11:11:37.647610',
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'08b343ba-8115-4d05-8ce5-52faecf2bd25',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'aeb9f944-abc9-4db3-aa13-138908301ca9',
'1dadb183-db77-424f-8457-c892652c7363',
false,
1,
'2025-06-09 11:11:37.647623',
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'38d15a61-6a82-4f18-8eb2-fc856af6a62d',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'1cfe5a88-b387-45fa-967f-a0725aa7446f',
'99e9913a-7221-49db-90e7-3bce7a121355',
false,
1,
'2025-06-15 11:11:37.647636',
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'afde7910-b73b-4619-b3ee-7a115aceab91',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'8826a7ef-4289-4680-bacf-cc1fd1c982b6',
'609b1955-9276-4491-8d6a-a9ee7e4d1774',
false,
1,
'2025-06-05 11:11:37.647648',
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'c34675dc-afc3-44c2-b0ff-ce19548d3df3',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'90a9b068-0947-49b3-b271-5904af704cd1',
'ddf1e0a8-d880-4790-8acf-2d2122d888e4',
false,
1,
'2025-06-03 11:11:37.647660',
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'efc7ec77-3fc9-471d-843a-1880a0baa400',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'af868e8f-8e9d-44f7-afd4-e5f638bd7456',
'5fb80b47-fb9c-41f9-9ae1-f36f32470ca3',
false,
1,
'2025-06-17 11:11:37.647672',
NOW(),
NOW()
);

INSERT INTO question_progress (
id, user_id, question_id, selected_answer_id, is_correct, attempt_count,
completed_at, created_at, updated_at
) VALUES (
'67a33f92-bf34-429d-b59f-901958edd586',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'3c511a41-d36b-457f-bed1-7fa25ef3af3d',
'de32ca52-ac40-4527-96ac-d4421a598ae5',
false,
1,
'2025-06-05 11:11:37.647683',
NOW(),
NOW()
);

-- Insert Tickets
INSERT INTO tickets (
id, user_id, course_id, type, status, priority, title, description,
attachments, assigned_to_id, created_at, updated_at
) VALUES (
'b89d91da-f75e-4d6f-917e-fdf39919b4b1',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'67d39f26-3dd9-4587-99c8-55039ab354c6',
'TECHNICAL_ISSUE',
'RESOLVED',
'HIGH',
'Video not loading in leadership lesson',
'I''m having trouble loading the video content in the Leadership Excellence course. The player shows a loading icon but never starts playing the lesson on team building.',
'["screenshot.png"]',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
NOW(),
NOW()
);

INSERT INTO tickets (
id, user_id, course_id, type, status, priority, title, description,
attachments, assigned_to_id, created_at, updated_at
) VALUES (
'a4d66e90-f0b5-429e-8ad8-256909b46d33',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'4cf5bff5-fdcf-4b75-aa52-d243d0b6c51a',
'CONTENT_INQUIRY',
'OPEN',
'MEDIUM',
'Question about Ecobank loan application',
'I need clarification on the loan application process mentioned in the Digital Finance course. Could you provide more details about the required documentation for the Ellevate program?',
'[]',
NULL,
NOW(),
NOW()
);

INSERT INTO tickets (
id, user_id, course_id, type, status, priority, title, description,
attachments, assigned_to_id, created_at, updated_at
) VALUES (
'b6937a4a-4c2d-43c0-a1af-822f3129b87e',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
NULL,
'GENERAL_INQUIRY',
'CLOSED',
'LOW',
'Certificate availability for Ellevate courses',
'When will I receive my certificate after completing the Leadership Excellence course? Will it be recognized by other institutions?',
'[]',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
NOW(),
NOW()
);

-- Insert Ticket Responses
INSERT INTO ticket_responses (
id, ticket_id, user_id, content, attachments, created_at, updated_at
) VALUES (
'27eca67f-7f86-4b4f-9626-a576205feb85',
'b89d91da-f75e-4d6f-917e-fdf39919b4b1',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'Thank you for reporting this technical issue with the Leadership Excellence course. We''ve identified the problem with the video streaming service and have implemented a fix. Please try refreshing the page and clearing your browser cache. If you continue to experience issues, please let us know.',
ARRAY[]::TEXT[],
NOW(),
NOW()
);

INSERT INTO ticket_responses (
id, ticket_id, user_id, content, attachments, created_at, updated_at
) VALUES (
'fc56e59e-1537-4552-b292-ff88bd652c58',
'b6937a4a-4c2d-43c0-a1af-822f3129b87e',
'user_2yiv3w14KpB9wlDb0EoPANJKsmG',
'Certificates for the Ecobank Ellevate Challenge courses are automatically generated and sent to your registered email address within 24-48 hours of course completion. You can also download it from your dashboard under the ''Certificates'' section. These certificates are recognized by Ecobank and partner institutions across Africa.',
ARRAY[]::TEXT[],
NOW(),
NOW()
);

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Update course statistics
UPDATE courses SET
lessons_count = (
SELECT COUNT(*) FROM lessons WHERE course_id = courses.id
),
length = (
SELECT COALESCE(SUM(duration), 0) FROM lessons WHERE course_id = courses.id
),
enrollments_count = (
SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id
);

-- Update lesson has_questions flag
UPDATE lessons SET
has_questions = (
SELECT COUNT(*) > 0 FROM questions WHERE lesson_id = lessons.id
);

COMMIT;
