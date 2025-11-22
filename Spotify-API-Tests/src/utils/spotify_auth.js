const axios = require('axios')
require('dotenv').config();


const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const AUTH_URL = 'https://accounts.spotify.com/api/token'
const API_BASE_URL = 'https://api.spotify.com/v1'


async function getSpotifyToken(){
    
    if (!CLIENT_ID || !CLIENT_SECRET){
        throw new Error('Credenciais inválidas ou inexistentes, porfavor configure suas variáveis de ambiente !')
    }

    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

    const response = await axios.post(
        AUTH_URL, 'grant_type=client_credentials',
        {
            headers:{
                'Authorization':`Basic ${credentials}`,
                "Content-Type": `application/x-www-form-urlencoded`
            }
        }
    )

    return response.data.access_token;
}

module.exports = {
    getSpotifyToken
}