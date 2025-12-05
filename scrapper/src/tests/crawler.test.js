import request from 'supertest'
import { app } from '../app.js'

describe('Crawler', () => {
   
    describe('POST /', ()=>{
        let response;
        beforeEach( async() => {
            response = await request(app).get('/').send()
        })

        test('should return a response with status 404 and type json', async() => {
			expect(response.status).toBe(404);
        }) 
    })
})