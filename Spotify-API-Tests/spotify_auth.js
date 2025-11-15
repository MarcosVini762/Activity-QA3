const axios = require('axios')

const CLIENTE_ID = process.env.CLIENTE_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const AUTH_URL = 'https://accounts.spotify.com/api/token'
const API_BASE_URL = 'https://api.spotify.com/v1'


async function getSpotifyToken(){
    
    if (!CLIENTE_ID || !CLIENT_SECRET){
        throw new Error('Credenciais inválidas ou inexistentes, porfavor configure suas variáveis de ambiente !')
    }

    const credentials = Buffer.from(`${CLIENTE_ID}:${CLIENT_SECRET}`).toString('base64')

    const response = await axios.post(
        AUTH_URL, 'grant_type=client_credentials',
        {
            headers:{
                'Authorization':`Basic ${credentials}`,
                "Content-Type": `application/x-www-form-urlencoded`
            }
        }
    )

    return response.data.acess_token;
}

module.exports = {
    getSpotifyToken
}