// Данные для всего сайта BeautyPro
window.BP_DATA = {
  services: [
    {
      id: 'women-haircut',
      name: 'Женская стрижка',
      category: 'hair',
      categoryLabel: 'Волосы',
      duration: '60 минут',
      price: '2 500 ₽',
      description: 'Подбор формы, мытьё, стрижка и лёгкая укладка.',
      masters: ['elena-orlova', 'svetlana-kim']
    },
    {
      id: 'coloring',
      name: 'Окрашивание в один тон',
      category: 'hair',
      categoryLabel: 'Волосы',
      duration: '120 минут',
      price: '4 900 ₽',
      description: 'Стойкий цвет, бережный уход и консультация по оттенку.',
      masters: ['elena-orlova']
    },
    {
      id: 'manicure',
      name: 'Маникюр с покрытием',
      category: 'nails',
      categoryLabel: 'Ногти',
      duration: '90 минут',
      price: '2 200 ₽',
      description: 'Аккуратная обработка, покрытие и уход за кутикулой.',
      masters: ['maria-ivanova']
    },
    {
      id: 'pedicure',
      name: 'Педикюр',
      category: 'nails',
      categoryLabel: 'Ногти',
      duration: '75 минут',
      price: '2 800 ₽',
      description: 'Комфортная процедура с деликатным уходом за стопами.',
      masters: ['maria-ivanova', 'anna-kuznetsova']
    },
    {
      id: 'relax-massage',
      name: 'Релакс-массаж',
      category: 'massage',
      categoryLabel: 'Массаж',
      duration: '75 минут',
      price: '3 200 ₽',
      description: 'Глубокое расслабление и восстановление после насыщенного дня.',
      masters: ['irina-smirnova']
    },
    {
      id: 'deep-cleansing',
      name: 'Чистка лица',
      category: 'beauty',
      categoryLabel: 'Косметология',
      duration: '90 минут',
      price: '3 800 ₽',
      description: 'Деликатная чистка, уход и рекомендации по домашнему уходу.',
      masters: ['svetlana-kim']
    },
    {
      id: 'brows',
      name: 'Архитектура бровей',
      category: 'brows',
      categoryLabel: 'Брови и ресницы',
      duration: '45 минут',
      price: '1 700 ₽',
      description: 'Подбор формы, коррекция и аккуратное окрашивание.',
      masters: ['olga-petrova']
    },
    {
      id: 'spa',
      name: 'SPA-ритуал',
      category: 'spa',
      categoryLabel: 'SPA',
      duration: '120 минут',
      price: '5 500 ₽',
      description: 'Полноценный ритуал расслабления с мягким уходом за телом.',
      masters: ['irina-smirnova', 'anna-kuznetsova']
    }
  ],

  masters: [
    {
      id: 'elena-orlova',
      name: 'Елена Орлова',
      specialization: 'Стилист по волосам',
      rating: 4.9,
      experience: '10+ лет',
      services: ['hair'],
      bio: 'Елена создаёт аккуратные и современные формы, подбирая образ под черты лица, стиль и привычки клиента.',
      shortBio: 'Стрижки, окрашивание и укладки с естественным результатом.',
      photoLabel: 'ЕЛ',
      // Портрет мастера (randomuser.me — бесплатные AI-сгенерированные фото)
      photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      city: 'Иркутск',
      // Работы мастера (Unsplash — бесплатные фото под лицензией Unsplash)
      works: [
        {
          url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop',
          caption: 'Стрижка и укладка'
        },
        {
          url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop',
          caption: 'Окрашивание в блонд'
        },
        {
          url: 'https://images.unsplash.com/photo-1562322140-8baeacacf3df?w=400&h=400&fit=crop',
          caption: 'Женская стрижка'
        },
        {
          url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=400&fit=crop',
          caption: 'Многоуровневое окрашивание'
        }
      ]
    },
    {
      id: 'maria-ivanova',
      name: 'Мария Иванова',
      specialization: 'Мастер маникюра и педикюра',
      rating: 4.8,
      experience: '8 лет',
      services: ['nails'],
      bio: 'Мария делает чистый, аккуратный и стойкий маникюр. Особое внимание уделяет комфорту клиента и качеству покрытия.',
      shortBio: 'Маникюр, педикюр и уход за руками.',
      photoLabel: 'МА',
      photoUrl: 'https://randomuser.me/api/portraits/women/67.jpg',
      city: 'Иркутск',
      works: [
        {
          url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop',
          caption: 'Маникюр с гель-лаком'
        },
        {
          url: 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=400&h=400&fit=crop',
          caption: 'Nail-арт дизайн'
        },
        {
          url: 'https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=400&h=400&fit=crop',
          caption: 'Нюдовый маникюр'
        },
        {
          url: 'https://images.unsplash.com/photo-1632345031435-8727f592d8db?w=400&h=400&fit=crop',
          caption: 'Педикюр с покрытием'
        }
      ]
    },
    {
      id: 'irina-smirnova',
      name: 'Ирина Смирнова',
      specialization: 'Массажист',
      rating: 4.9,
      experience: '12 лет',
      services: ['massage', 'spa'],
      bio: 'Ирина работает мягко и бережно, помогая снять напряжение и восстановить силы после рабочего дня.',
      shortBio: 'Релакс-массаж и SPA-программы.',
      photoLabel: 'ИР',
      photoUrl: 'https://randomuser.me/api/portraits/women/26.jpg',
      city: 'Иркутск',
      works: [
        {
          url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&h=400&fit=crop',
          caption: 'Релаксирующий массаж'
        },
        {
          url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=400&fit=crop',
          caption: 'SPA-ритуал'
        },
        {
          url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&h=400&fit=crop',
          caption: 'Массаж спины'
        },
        {
          url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop',
          caption: 'Горячие камни'
        }
      ]
    },
    {
      id: 'olga-petrova',
      name: 'Ольга Петрова',
      specialization: 'Бровист и ламимейкер',
      rating: 4.7,
      experience: '7 лет',
      services: ['brows'],
      bio: 'Ольга подбирает форму бровей с учётом особенностей лица и делает образ более выразительным без лишней резкости.',
      shortBio: 'Архитектура бровей и мягкая коррекция.',
      photoLabel: 'ОЛ',
      photoUrl: 'https://randomuser.me/api/portraits/women/38.jpg',
      city: 'Иркутск',
      works: [
        {
          url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop',
          caption: 'Архитектура бровей'
        },
        {
          url: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&h=400&fit=crop',
          caption: 'Коррекция и окрашивание'
        },
        {
          url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=400&fit=crop',
          caption: 'Ламинирование бровей'
        },
        {
          url: 'https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=400&h=400&fit=crop',
          caption: 'Натуральная форма'
        }
      ]
    },
    {
      id: 'svetlana-kim',
      name: 'Светлана Ким',
      specialization: 'Косметолог-эстетист',
      rating: 4.8,
      experience: '9 лет',
      services: ['beauty', 'hair'],
      bio: 'Светлана сочетает уходовые и эстетические процедуры, помогает коже выглядеть ухоженно и свежо.',
      shortBio: 'Чистка лица, уход и деликатные процедуры.',
      photoLabel: 'СВ',
      photoUrl: 'https://randomuser.me/api/portraits/women/52.jpg',
      city: 'Иркутск',
      works: [
        {
          url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop',
          caption: 'Уход за лицом'
        },
        {
          url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=400&fit=crop',
          caption: 'Косметологическая процедура'
        },
        {
          url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=400&fit=crop',
          caption: 'Маска для лица'
        },
        {
          url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
          caption: 'Результат после чистки'
        }
      ]
    },
    {
      id: 'anna-kuznetsova',
      name: 'Анна Кузнецова',
      specialization: 'Spa-специалист',
      rating: 4.8,
      experience: '6 лет',
      services: ['spa', 'nails'],
      bio: 'Анна отвечает за атмосферу полного расслабления: деликатный уход, мягкие техники и внимание к деталям.',
      shortBio: 'SPA-ритуалы и восстановительные уходы.',
      photoLabel: 'АН',
      photoUrl: 'https://randomuser.me/api/portraits/women/29.jpg',
      city: 'Иркутск',
      works: [
        {
          url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&h=400&fit=crop',
          caption: 'SPA-обёртывание'
        },
        {
          url: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=400&h=400&fit=crop',
          caption: 'Ароматерапия'
        },
        {
          url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
          caption: 'Комплексный уход'
        },
        {
          url: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=400&fit=crop',
          caption: 'Уход за телом'
        }
      ]
    }
  ],

  testimonials: [
    {
      name: 'Марина',
      rating: 5,
      text: 'Очень чистый салон, спокойная атмосфера и отличный результат. Записалась без лишних звонков.'
    },
    {
      name: 'Ольга',
      rating: 5,
      text: 'Понравилось, что можно выбрать мастера и сразу увидеть его страницу с информацией и отзывами.'
    },
    {
      name: 'Екатерина',
      rating: 4,
      text: 'Красивый интерфейс и удобная запись. Особенно понравился календарь и понятная структура сайта.'
    }
  ],

  defaultReviews: {
    'elena-orlova': [
      { name: 'Мария', rating: 5, text: 'Елена прекрасно подобрала форму стрижки, результат очень аккуратный.', date: '12.04.2026' },
      { name: 'Наталья', rating: 5, text: 'Подробно объяснила уход и помогла выбрать оттенок для окрашивания.', date: '03.04.2026' }
    ],
    'maria-ivanova': [
      { name: 'Ирина', rating: 5, text: 'Маникюр сделан безупречно, покрытие держится отлично.', date: '14.04.2026' },
      { name: 'Алина', rating: 4, text: 'Очень аккуратно и чисто, приятная беседа и быстрый приём.', date: '07.04.2026' }
    ],
    'irina-smirnova': [
      { name: 'Софья', rating: 5, text: 'После массажа ушло напряжение в спине, чувствую себя намного лучше.', date: '10.04.2026' }
    ],
    'olga-petrova': [
      { name: 'Юлия', rating: 5, text: 'Ольга сделала очень естественные брови, лицо стало выразительнее.', date: '02.04.2026' }
    ],
    'svetlana-kim': [
      { name: 'Дарья', rating: 5, text: 'Кожа после чистки стала заметно чище и свежее, спасибо за бережный подход.', date: '15.04.2026' }
    ],
    'anna-kuznetsova': [
      { name: 'Виктория', rating: 5, text: 'SPA-программа была настоящим отдыхом, очень комфортно и красиво.', date: '11.04.2026' }
    ]
  }
};