export const API_URL = 'http://177.44.248.32:8083'
//export const API_URL = 'http://localhost:3003'

const token = window.localStorage.getItem('token');

export function PERSON_FILTER(body) {
    return {
        url: API_URL + '/persons/filter/persons',
        //body: JSON.stringify(body),
        options: {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token,
            },
            params: body
        },
    };
}