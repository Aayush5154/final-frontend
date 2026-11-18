import { io } from 'socket.io-client';

let socket = null;

const getSocket = () => {
    if (!socket) {
        socket = io('/', {
            withCredentials: true,
            autoConnect: false,
            transports: ['websocket', 'polling'],
        });
    }

    return socket;
};

export { getSocket };
