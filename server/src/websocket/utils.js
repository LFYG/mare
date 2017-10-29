import liburl from 'url';
import uuid from 'node-uuid';

export default {

    id: (prefix) => {
        return `${prefix}:${uuid.v4()}`;
    },

    location: (url) => {
        url = decodeURIComponent(url).replace(/\|/, '&');
        return liburl.parse(url, true);
    },

};
