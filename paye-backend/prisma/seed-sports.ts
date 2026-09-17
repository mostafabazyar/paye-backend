import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SPORTS = [
  { name: "Football",    slug: "football",    icon: "⚽", category: "ball",     sortOrder: 10 },
  { name: "Basketball",  slug: "basketball",  icon: "🏀", category: "ball",     sortOrder: 20 },
  { name: "Volleyball",  slug: "volleyball",  icon: "🏐", category: "ball",     sortOrder: 30 },
  { name: "Tennis",      slug: "tennis",      icon: "🎾", category: "racket",   sortOrder: 40 },
  { name: "Badminton",   slug: "badminton",   icon: "🏸", category: "racket",   sortOrder: 50 },
  { name: "Table Tennis",slug: "table-tennis",icon: "🏓", category: "racket",   sortOrder: 60 },
  { name: "Swimming",    slug: "swimming",    icon: "🏊", category: "water",    sortOrder: 70 },
  { name: "Running",     slug: "running",     icon: "🏃", category: "cardio",   sortOrder: 80 },
  { name: "Cycling",     slug: "cycling",     icon: "🚴", category: "cardio",   sortOrder: 90 },
  { name: "Hiking",      slug: "hiking",      icon: "🥾", category: "outdoor",  sortOrder: 100 },
  { name: "Gym",         slug: "gym",         icon: "🏋️", category: "strength", sortOrder: 110 },
  { name: "CrossFit",    slug: "crossfit",    icon: "💪", category: "strength", sortOrder: 120 },
  { name: "Yoga",        slug: "yoga",        icon: "🧘", category: "mind",     sortOrder: 130 },
  { name: "Pilates",     slug: "pilates",     icon: "🤸", category: "mind",     sortOrder: 140 },
  { name: "Boxing",      slug: "boxing",      icon: "🥊", category: "combat",   sortOrder: 150 },
  { name: "Martial Arts",slug: "martial-arts",icon: "🥋", category: "combat",   sortOrder: 160 },
  { name: "Climbing",    slug: "climbing",    icon: "🧗", category: "outdoor",  sortOrder: 170 },
  { name: "Skiing",      slug: "skiing",      icon: "⛷️", category: "outdoor", sortOrder: 180 },
  { name: "Skateboarding", slug: "skateboarding", icon: "🛹", category: "extreme", sortOrder: 190 },
  { name: "Dance",       slug: "dance",       icon: "💃", category: "mind",     sortOrder: 200 },
];

async function main() {
  console.log("Seeding sports...");

  for (const s of SPORTS) {
    await prisma.sport.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        icon: s.icon,
        category: s.category,
        sortOrder: s.sortOrder,
      },
      create: {
        name: s.name,
        slug: s.slug,
        icon: s.icon,
        category: s.category,
        sortOrder: s.sortOrder,
        isActive: true,
      },
    });
  }

  console.log(`✔ Seeded ${SPORTS.length} sports`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });