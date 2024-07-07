import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
	try {
		const user = await prisma.user.findFirst()
		if (!user) {
			await prisma.user.create({
				data: {
					name: 'Alice',
					email: 'alice@prisma.io',
				},
			})
		}
	} catch (error) {
		console.error('Error seeding database:', error)
	}
}

main()
	.catch(e => {
		console.error('Unhandled error in seed script:', e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
