const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with sample users and profiles...');

  // Clear existing data (be careful in production!)
  await prisma.request.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const usersData = [
    {
      phone: '+10000000001',
      name: 'Alice',
      age: 28,
      gender: 'female',
      bio: 'Tennis lover and morning runner',
      photos: JSON.stringify(['https://i.pravatar.cc/300?img=1']),
      avgRating: 4.5,
      isVerified: true,
    },
    {
      phone: '+10000000002',
      name: 'Bob',
      age: 31,
      gender: 'male',
      bio: 'Football enthusiast',
      photos: JSON.stringify(['https://i.pravatar.cc/300?img=2']),
      avgRating: 4.2,
      isVerified: true,
    },
    {
      phone: '+10000000003',
      name: 'Carla',
      age: 24,
      gender: 'female',
      bio: 'Gym regular and weight trainer',
      photos: JSON.stringify(['https://i.pravatar.cc/300?img=3']),
      avgRating: 4.8,
      isVerified: true,
    },
    {
      phone: '+10000000004',
      name: 'Dan',
      age: 35,
      gender: 'male',
      bio: 'Trail runner on weekends',
      photos: JSON.stringify(['https://i.pravatar.cc/300?img=4']),
      avgRating: 4.0,
      isVerified: true,
    },
    {
      phone: '+10000000005',
      name: 'Eve',
      age: 22,
      gender: 'female',
      bio: 'Casual swimmer and cyclist',
      photos: JSON.stringify(['https://i.pravatar.cc/300?img=5']),
      avgRating: 4.7,
      isVerified: true,
    },
  ];

  const createdUsers = [];

  for (const u of usersData) {
    const user = await prisma.user.create({ data: u });
    createdUsers.push(user);
  }

  const profilesData = [
    {
      userId: createdUsers[0].id,
      exerciseType: 'ONE_ON_ONE',
      genderPreference: 'ANY',
      title: 'Tennis Match - Weekend',
      location: 'Central Park',
      maxInvites: 1,
      goDutch: false,
      moreInfo: 'Looking for competitive practice',
      tags: 'Tennis',
    },
    {
      userId: createdUsers[1].id,
      exerciseType: 'MANY_ON_MANY',
      genderPreference: 'ANY',
      title: '5-a-side Football',
      location: 'City Stadium',
      maxInvites: 4,
      goDutch: true,
      moreInfo: 'Casual friendly match',
      tags: 'Football',
    },
    {
      userId: createdUsers[2].id,
      exerciseType: 'ONE_ON_ONE',
      genderPreference: 'ANY',
      title: 'Gym Partner - Strength',
      location: 'Downtown Gym',
      maxInvites: 1,
      goDutch: false,
      moreInfo: 'Spotter and programming',
      tags: 'Gym',
    },
    {
      userId: createdUsers[3].id,
      exerciseType: 'ONE_ON_MANY',
      genderPreference: 'ANY',
      title: 'Trail Running Group',
      location: 'Hillside Trail',
      maxInvites: 6,
      goDutch: false,
      moreInfo: 'Easy pace, 10km',
      tags: 'Running,Hiking',
    },
    {
      userId: createdUsers[4].id,
      exerciseType: 'ONE_ON_ONE',
      genderPreference: 'ANY',
      title: 'Swim Partner - Laps',
      location: 'Community Pool',
      maxInvites: 1,
      goDutch: false,
      moreInfo: 'Prefer morning sessions',
      tags: 'Swimming',
    },
  ];

  const createdProfiles = [];

  for (const p of profilesData) {
    const profile = await prisma.profile.create({ data: p });
    createdProfiles.push(profile);
  }

  await prisma.request.create({ data: { profileId: createdProfiles[0].id, requesterId: createdUsers[1].id, receiverId: createdProfiles[0].userId, status: 'PENDING' } });

  await prisma.request.create({ data: { profileId: createdProfiles[1].id, requesterId: createdUsers[2].id, receiverId: createdProfiles[1].userId, status: 'PENDING' } });

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
