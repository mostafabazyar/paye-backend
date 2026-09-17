import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IRAN_CITIES: { name: string; nameFa: string }[] = [
  // Tehran province
  { name: "Tehran", nameFa: "تهران" },
  { name: "Karaj", nameFa: "کرج" },
  { name: "Varamin", nameFa: "ورامین" },
  { name: "Shahriar", nameFa: "شهریار" },
  { name: "Islamshahr", nameFa: "اسلامشهر" },
  { name: "Robat Karim", nameFa: "رباط کریم" },
  { name: "Pakdasht", nameFa: "پاکدشت" },
  { name: "Qarchak", nameFa: "قرچک" },
  { name: "Pishva", nameFa: "پیشوا" },
  { name: "Damavand", nameFa: "دماوند" },
  { name: "Firuzkuh", nameFa: "فیروزکوه" },

  // Isfahan province
  { name: "Isfahan", nameFa: "اصفهان" },
  { name: "Kashan", nameFa: "کاشان" },
  { name: "Khomeynishahr", nameFa: "خمینی‌شهر" },
  { name: "Najafabad", nameFa: "نجف‌آباد" },
  { name: "Shahin Shahr", nameFa: "شاهین‌شهر" },
  { name: "Fuladshahr", nameFa: "فولادشهر" },
  { name: "Zarrinshahr", nameFa: "زرین‌شهر" },
  { name: "Natanz", nameFa: "نطنز" },
  { name: "Khomeyn", nameFa: "خمین" },
  { name: "Golpayegan", nameFa: "گلپایگان" },
  { name: "Dehaqan", nameFa: "دهاقان" },

  // Fars province
  { name: "Shiraz", nameFa: "شیراز" },
  { name: "Marvdasht", nameFa: "مرودشت" },
  { name: "Kazerun", nameFa: "کازرون" },
  { name: "Jahrom", nameFa: "جهرم" },
  { name: "Fasa", nameFa: "فسا" },
  { name: "Lar", nameFa: "لار" },
  { name: "Abadeh", nameFa: "آباده" },
  { name: "Darab", nameFa: "داراب" },
  { name: "Nehriz", nameFa: "نی‌ریز" },
  { name: "Sepidan", nameFa: "سپیدان" },

  // Khorasan Razavi
  { name: "Mashhad", nameFa: "مشهد" },
  { name: "Neyshabur", nameFa: "نیشابور" },
  { name: "Sabzevar", nameFa: "سبزوار" },
  { name: "Torbat-e Heydarieh", nameFa: "تربت حیدریه" },
  { name: "Torbat-e Jam", nameFa: "تربت جام" },
  { name: "Quchan", nameFa: "قوچان" },
  { name: "Kashmar", nameFa: "کاشمر" },
  { name: "Gonabad", nameFa: "گناباد" },
  { name: "Chenaran", nameFa: "چناران" },
  { name: "Khalilabad", nameFa: "خلیل‌آباد" },

  // East Azerbaijan
  { name: "Tabriz", nameFa: "تبریز" },
  { name: "Maragheh", nameFa: "مراغه" },
  { name: "Marand", nameFa: "مرند" },
  { name: "Ahar", nameFa: "اهر" },
  { name: "Mianeh", nameFa: "میانه" },
  { name: "Sarab", nameFa: "سراب" },
  { name: "Bonab", nameFa: "بناب" },
  { name: "Azarshahr", nameFa: "آذرشهر" },

  // West Azerbaijan
  { name: "Urmia", nameFa: "ارومیه" },
  { name: "Khoy", nameFa: "خوی" },
  { name: "Mahabad", nameFa: "مهاباد" },
  { name: "Miandoab", nameFa: "میاندوآب" },
  { name: "Salmas", nameFa: "سلماس" },
  { name: "Bukan", nameFa: "بوکان" },
  { name: "Naqadeh", nameFa: "نقده" },

  // Khuzestan
  { name: "Ahvaz", nameFa: "اهواز" },
  { name: "Abadan", nameFa: "آبادان" },
  { name: "Khorramshahr", nameFa: "خرمشهر" },
  { name: "Dezful", nameFa: "دزفول" },
  { name: "Andimeshk", nameFa: "اندیمشک" },
  { name: "Behbahan", nameFa: "بهبهان" },
  { name: "Masjed Soleyman", nameFa: "مسجد سلیمان" },
  { name: "Shushtar", nameFa: "شوشتر" },
  { name: "Ramhormoz", nameFa: "رامهرمز" },
  { name: "Susangerd", nameFa: "سوسنگرد" },

  // Gilan
  { name: "Rasht", nameFa: "رشت" },
  { name: "Bandar Anzali", nameFa: "بندر انزلی" },
  { name: "Lahijan", nameFa: "لاهیجان" },
  { name: "Langarud", nameFa: "لنگرود" },
  { name: "Astara", nameFa: "آستارا" },
  { name: "Talesh", nameFa: "تالش" },
  { name: "Rudsar", nameFa: "رودسر" },
  { name: "Fuman", nameFa: "فومن" },

  // Mazandaran
  { name: "Sari", nameFa: "ساری" },
  { name: "Babol", nameFa: "بابل" },
  { name: "Amol", nameFa: "آمل" },
  { name: "Qaem Shahr", nameFa: "قائم‌شهر" },
  { name: "Behshahr", nameFa: "بهشهر" },
  { name: "Chalus", nameFa: "چالوس" },
  { name: "Ramsar", nameFa: "رامسر" },
  { name: "Noshahr", nameFa: "نوشهر" },
  { name: "Nowshahr", nameFa: "نور" },

  // Kerman
  { name: "Kerman", nameFa: "کرمان" },
  { name: "Rafsanjan", nameFa: "رفسنجان" },
  { name: "Sirjan", nameFa: "سیرجان" },
  { name: "Bam", nameFa: "بم" },
  { name: "Jiroft", nameFa: "جیرفت" },
  { name: "Zarand", nameFa: "زرند" },
  { name: "Shahr-e Babak", nameFa: "شهر بابک" },
  { name: "Kahnuj", nameFa: "کهنوج" },

  // Alborz (covered by Karaj above), Qom, Markazi, etc.
  { name: "Qom", nameFa: "قم" },
  { name: "Arak", nameFa: "اراک" },
  { name: "Saveh", nameFa: "ساوه" },
  { name: "Khomeyn", nameFa: "خمین" },
  { name: "Mahallat", nameFa: "محلات" },
  { name: "Delijan", nameFa: "دلیجان" },

  // Hamedan
  { name: "Hamedan", nameFa: "همدان" },
  { name: "Malayer", nameFa: "ملایر" },
  { name: "Nahavand", nameFa: "نهاوند" },
  { name: "Tuyserkan", nameFa: "تویسرکان" },

  // Kermanshah
  { name: "Kermanshah", nameFa: "کرمانشاه" },
  { name: "Eslamabad-e Gharb", nameFa: "اسلام‌آباد غرب" },
  { name: "Harsin", nameFa: "هرسین" },
  { name: "Kangavar", nameFa: "کنگاور" },
  { name: "Sonqor", nameFa: "سنقر" },

  // Lorestan
  { name: "Khorramabad", nameFa: "خرم‌آباد" },
  { name: "Borujerd", nameFa: "بروجرد" },
  { name: "Dorud", nameFa: "دورود" },
  { name: "Aligudarz", nameFa: "الیگودرز" },

  // Golestan
  { name: "Gorgan", nameFa: "گرگان" },
  { name: "Gonbad-e Kavus", nameFa: "گنبد کاووس" },
  { name: "Aliabad-e Katul", nameFa: "علی‌آباد کتول" },
  { name: "Bandar Torkaman", nameFa: "بندر ترکمن" },

  // Ardabil
  { name: "Ardabil", nameFa: "اردبیل" },
  { name: "Parsabad", nameFa: "پارس‌آباد" },
  { name: "Meshgin Shahr", nameFa: "مشگین‌شهر" },
  { name: "Khalkhal", nameFa: "خلخال" },

  // Qazvin
  { name: "Qazvin", nameFa: "قزوین" },
  { name: "Takestan", nameFa: "تاکستان" },
  { name: "Abyek", nameFa: "آبیک" },

  // Zanjan
  { name: "Zanjan", nameFa: "زنجان" },
  { name: "Abhar", nameFa: "ابهر" },
  { name: "Khorramdarreh", nameFa: "خرمدره" },
  { name: "Qidar", nameFa: "قیدار" },

  // Yazd
  { name: "Yazd", nameFa: "یزد" },
  { name: "Meybod", nameFa: "میبد" },
  { name: "Ardakan", nameFa: "اردکان" },
  { name: "Bafq", nameFa: "بافق" },

  // Hormozgan
  { name: "Bandar Abbas", nameFa: "بندرعباس" },
  { name: "Qeshm", nameFa: "قشم" },
  { name: "Kish", nameFa: "کیش" },
  { name: "Minab", nameFa: "میناب" },
  { name: "Bandar Lengeh", nameFa: "بندر لنگه" },

  // Sistan and Baluchestan
  { name: "Zahedan", nameFa: "زاهدان" },
  { name: "Zabol", nameFa: "زابل" },
  { name: "Chabahar", nameFa: "چابهار" },
  { name: "Iranshahr", nameFa: "ایرانشهر" },

  // Bushehr
  { name: "Bushehr", nameFa: "بوشهر" },
  { name: "Borazjan", nameFa: "برازجان" },
  { name: "Bandar Ganaveh", nameFa: "بندر گناوه" },

  // Chaharmahal and Bakhtiari
  { name: "Shahrekord", nameFa: "شهرکرد" },
  { name: "Borujen", nameFa: "بروجن" },
  { name: "Farokhshahr", nameFa: "فرخشهر" },

  // Kohgiluyeh and Boyer-Ahmad
  { name: "Yasuj", nameFa: "یاسوج" },
  { name: "Dogonbadan", nameFa: "دوگنبدان" },

  // North Khorasan
  { name: "Bojnord", nameFa: "بجنورد" },
  { name: "Shirvan", nameFa: "شیروان" },
  { name: "Esfarayen", nameFa: "اسفراین" },

  // South Khorasan
  { name: "Birjand", nameFa: "بیرجند" },
  { name: "Qaen", nameFa: "قائن" },
  { name: "Ferdows", nameFa: "فردوس" },

  // Semnan
  { name: "Semnan", nameFa: "سمنان" },
  { name: "Shahrud", nameFa: "شاهرود" },
  { name: "Damghan", nameFa: "دامغان" },
  { name: "Garmsar", nameFa: "گرمسار" },

  // Ilam
  { name: "Ilam", nameFa: "ایلام" },
  { name: "Dehloran", nameFa: "دهلران" },
  { name: "Abdanan", nameFa: "آبدانان" },
];

// Neighborhoods only for the biggest cities for now
const TEHRAN_NEIGHBORHOODS = [
  { name: "Vanak", nameFa: "ونک" },
  { name: "Tajrish", nameFa: "تجریش" },
  { name: "Saadat Abad", nameFa: "سعادت‌آباد" },
  { name: "Shahrak-e Gharb", nameFa: "شهرک غرب" },
  { name: "Ekhtiarieh", nameFa: "اختیاریه" },
  { name: "Jannat Abad", nameFa: "جنت‌آباد" },
  { name: "Niavaran", nameFa: "نیاوران" },
  { name: "Yusef Abad", nameFa: "یوسف‌آباد" },
  { name: "Punak", nameFa: "پونک" },
  { name: "Sadeghieh", nameFa: "صادقیه" },
  { name: "Shahr-e Ziba", nameFa: "شهرزیبا" },
  { name: "Farmanieh", nameFa: "فرمانیه" },
  { name: "Afsarieh", nameFa: "افسریه" },
  { name: "Nehzat Abad", nameFa: "نهضت‌آباد" },
  { name: "Gisha", nameFa: "گیشا" },
  { name: "Amir Abad", nameFa: "امیرآباد" },
  { name: "Karim Khan", nameFa: "کریم‌خان" },
  { name: "Behjat Abad", nameFa: "بهجت‌آباد" },
  { name: "Abbas Abad", nameFa: "عباس‌آباد" },
  { name: "Velenjak", nameFa: "ولنجک" },
];

const MASHHAD_NEIGHBORHOODS = [
  { name: "Ahmadabad", nameFa: "احمدآباد" },
  { name: "Sajjad", nameFa: "سجاد" },
  { name: "Vakilabad", nameFa: "وکیل‌آباد" },
  { name: "Rezashahr", nameFa: "رضاشهر" },
  { name: "Tarab", nameFa: "طرب" },
  { name: "Kuhsangi", nameFa: "کوهسنگی" },
];

const ISFAHAN_NEIGHBORHOODS = [
  { name: "Jolfa", nameFa: "جلفا" },
  { name: "Chaharbagh", nameFa: "چهارباغ" },
  { name: "Sephahan", nameFa: "سپاهان‌شهر" },
  { name: "Rehnan", nameFa: "رهنان" },
  { name: "Kaveh", nameFa: "کاوه" },
];

const SHIRAZ_NEIGHBORHOODS = [
  { name: "Zand", nameFa: "زند" },
  { name: "Maali Abad", nameFa: "معالی‌آباد" },
  { name: "Eram", nameFa: "ارم" },
  { name: "Qasrodasht", nameFa: "قصردشت" },
  { name: "Sadi", nameFa: "سعدی" },
];

const TABRIZ_NEIGHBORHOODS = [
  { name: "El Goli", nameFa: "ائل‌گلی" },
  { name: "Valiasr", nameFa: "ولیعصر" },
  { name: "Abrasan", nameFa: "آبرسان" },
  { name: "Bagh-e Shomal", nameFa: "باغ شمال" },
];

async function main() {
  console.log("Seeding locations...");

  // 1) Country: Iran
  const iran = await prisma.country.upsert({
    where: { code: "IR" },
    update: { name: "Iran", nameFa: "ایران" },
    create: { code: "IR", name: "Iran", nameFa: "ایران" },
  });

  // 2) Cities
  let cityCount = 0;
  for (const c of IRAN_CITIES) {
    await prisma.city.upsert({
      where: { countryId_name: { countryId: iran.id, name: c.name } },
      update: { nameFa: c.nameFa },
      create: { countryId: iran.id, name: c.name, nameFa: c.nameFa },
    });
    cityCount++;
  }
  console.log(`✔ Seeded ${cityCount} cities`);

  // 3) Neighborhoods for the big cities
  const neighborhoodMap: Record<string, { name: string; nameFa: string }[]> = {
    Tehran: TEHRAN_NEIGHBORHOODS,
    Mashhad: MASHHAD_NEIGHBORHOODS,
    Isfahan: ISFAHAN_NEIGHBORHOODS,
    Shiraz: SHIRAZ_NEIGHBORHOODS,
    Tabriz: TABRIZ_NEIGHBORHOODS,
  };

  let neighborhoodCount = 0;
  for (const [cityName, hoods] of Object.entries(neighborhoodMap)) {
    const city = await prisma.city.findFirst({
      where: { countryId: iran.id, name: cityName },
    });

    if (!city) {
      console.warn(`  ! City not found for neighborhoods: ${cityName}`);
      continue;
    }

    for (const n of hoods) {
      await prisma.neighborhood.upsert({
        where: { cityId_name: { cityId: city.id, name: n.name } },
        update: { nameFa: n.nameFa },
        create: { cityId: city.id, name: n.name, nameFa: n.nameFa },
      });
      neighborhoodCount++;
    }
  }
  console.log(`✔ Seeded ${neighborhoodCount} neighborhoods`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });