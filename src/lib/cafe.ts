export const CAFE = {
  name: 'МОНО',
  nameFull: 'кафе «Моно»',
  tagline: 'Япония · Италия · Европа в одном меню',
  city: 'Молодогвардейск',
  address: 'ул. Ленина, 18',
  addressFull: 'г. Молодогвардейск, ул. Ленина, 18',
  phones: [
    { display: '+7 (959) 279-98-99', tel: '+79592799899' },
    { display: '+7 (959) 560-29-69', tel: '+79595602969' },
  ],
  hours: { open: 9, close: 21, label: 'Ежедневно 09:00–21:00' },
  vk: 'https://vk.ru/cafemono',
  mapUrl: 'https://yandex.ru/maps/?text=%D0%9C%D0%BE%D0%BB%D0%BE%D0%B4%D0%BE%D0%B3%D0%B2%D0%B0%D1%80%D0%B4%D0%B5%D0%B9%D1%81%D0%BA%2C%20%D1%83%D0%BB%D0%B8%D1%86%D0%B0%20%D0%9B%D0%B5%D0%BD%D0%B8%D0%BD%D0%B0%2C%2018',
  delivery: {
    fee: 150,
    freeFrom: 1000,
    minOrder: 500,
    time: '45–60 минут',
    zone: 'Молодогвардейск и ближайшие районы',
    pickup: '15–20 минут',
  },
} as const;

export const LUNCH_HOURS = 'ежедневно с 12:00 до 16:00';
