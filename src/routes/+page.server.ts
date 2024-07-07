import { v4 as uuidv4 } from 'uuid'
import { redirect } from '@sveltejs/kit'
/** @type {import('./$types').PageServerLoad} */
import type { ServerLoad, Actions } from '@sveltejs/kit'
import { PrismaClient, Prisma } from '@prisma/client'
import { dev } from '$app/environment'
import { fail } from '@sveltejs/kit'

const prisma = new PrismaClient()
export const load: ServerLoad = async ({ locals, url, cookies }) => {
    const sessionCookie = cookies.get('session_id')
    let token
    if (sessionCookie) {
        const session = await prisma.session.findFirst({
            where: {
                token: sessionCookie,

            }, include: {
                user: true,
            },
        })
        token = session?.token
    }
    return {
        token
    }
}

/** @type {import('./$types').Actions} */
export const actions = {
    submitname: async ({ event, request, cookies }) => {
        const data = await request.formData()
        console.log('datdataa', data)
        const email = data.get('email').toString()
        const token = uuidv4()
        try {
            const createdSession = await prisma.session.create({
                data: {
                    token: token,
                    user: {
                        create: {
                            email: email,
                            // name: data.get('name').toString(),
                        }
                    }
                }
            })
            cookies.set('session_id', token, {
                path: '/',
                httpOnly: true,
                sameSite: 'strict',
                secure: !dev,
                maxAge: 60 * 60 * 24 * 7 // one week
            })
            return { success: true }
        } catch (error) {
            console.log('error', error)
            return fail(400, { email, alreadyExist: true })
        }
    },
}