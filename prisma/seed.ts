import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const questTemplates = [
  {
    "title": "Brush Your Teeth",
    "points": 5,
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/quest-cmf21ejwa00035e1rdtcar85j-1756787521844-6UyJtsw02xRqsblyYab5w6ZpLqhuMx.jpg",
    "frequency": "daily"
  },
  {
    "title": "Put Away Dishes",
    "points": 20,
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/quest-cmf21m9vm0009vamwdjq3l7c9-1756787553190-L6OicUJZNUkWNu8RC01vUgSO7wLZ30.jpg",
    "frequency": "daily"
  },
  {
    "title": "Shower",
    "points": 10,
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/quest-cmf21k6if0001vamwg1ymr48j-1756787592859-Hls7YMmyMMBx9WmaWNxIoEETHxMYZ3.jpg",
    "frequency": "daily"
  },
  {
    "title": "Pick Up Toys",
    "points": 15,
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/quest-cmf21luwt0007vamwzgo1c295-1756787616218-aKB3mtmhmP3wEur9UOXaJiJHQobMoy.jpg",
    "frequency": "daily"
  },
  {
    "title": "Vacuum House",
    "points": 15,
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/quest-cmf21l1tx0005vamwjij7uo13-1756787644991-PwgjUeJo8nEKKabgxZlrXlTCrbLUeK.jpg",
    "frequency": "daily"
  },
  {
    "title": "Tidy Clothes",
    "points": 10,
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/quest-cmf21kq3i0003vamwaumb4b11-1756787769522-ZHQfTrVmCsZhNxlqbx6AZNEPOkYpA2.jpg",
    "frequency": "daily"
  },
  {
    "title": "Tidy Up Your Dungeon (Room)",
    "points": 30,
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/quest-cmf1vqknw000lzd9ih9bp5s90-1756785718686-N5EBuVZgkoVrQ6aTYEHrL8pj0Nr8Gw.jpg",
    "frequency": "daily"
  },
  {
    "title": "Homework (30 mins)",
    "points": 10,
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/quest-cmf2026jp0003mre56tbtoxpn-1756785620429-TNhUAf5XSD98k5tm1672KQgD6309Vz.jpg",
    "frequency": "daily"
  }
]

const rewardTemplates = [
  {
    "title": "Screen Time",
    "description": "1 Hour",
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/reward-cmf20c8jw0009mre57pkumwd7-1756784852279-cmXcQBd77pSdZDkNxJnlDrDwU2wHxG.jpg",
    "pointsCost": 60
  },
  {
    "title": "Stay Up Late",
    "description": "",
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/reward-cmf22bccv000dhd69z4ysaheb-1756788744354-OCCd4TDptrWTbN8JrnT2PbACaVONUO.jpg",
    "pointsCost": 100
  },
  {
    "title": "Swimming Pool",
    "description": "",
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/reward-cmf22b3jr000bhd697tbh3m5p-1756788818282-Sd1CP6EIaifdprTAkhUDCvG8VKPHd0.jpg",
    "pointsCost": 150
  },
  {
    "title": "Shopping",
    "description": "Choose ONE of anything!",
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/reward-cmf22949u0001hd698zy26ba9-1756788846613-dARxNu7hBfPS1NOToVq4N0r90psGyl.jpg",
    "pointsCost": 150
  },
  {
    "title": "Park",
    "description": "",
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/reward-cmf22at600009hd69equ0ctol-1756788911252-p1XEAySu8Sv7iebO2S7GlZilNlCVTM.jpg",
    "pointsCost": 70
  },
  {
    "title": "Dinner Out",
    "description": "",
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/reward-cmf22ajn50007hd69dt3cu0tt-1756788936204-53hsyD6VuhgNuAn8bJ9KvzogsdcA5b.jpg",
    "pointsCost": 300
  },
  {
    "title": "Pet Shop Visit",
    "description": "",
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/reward-cmf22a1ff0005hd69jlm5p4qc-1756788968244-kzGDqqqFb2oCeFM1UcBfMLvkZ3sDHH.jpg",
    "pointsCost": 100
  },
  {
    "title": "Chipmunks",
    "description": "",
    "image": "https://bkjsxcrgut6cches.public.blob.vercel-storage.com/reward-cmf229g6n0003hd69lfa1npkr-1756788991065-px7aolMw8yKoUAV8awlW3qxtN4czJl.jpg",
    "pointsCost": 500
  }
]

async function main() {
  console.log('Seeding quest templates...')
  for (const template of questTemplates) {
    await prisma.questTemplate.create({
      data: {
        ...template,
        live: true
      }
    })
  }

  console.log('Seeding reward templates...')
  for (const template of rewardTemplates) {
    await prisma.rewardTemplate.create({
      data: {
        ...template,
        live: true
      }
    })
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })