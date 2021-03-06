const { create, decryptMedia } = require('@open-wa/wa-automate')
const fs = require('fs-extra')
const moment = require('moment')

const serverOption = {
    headless: true,
    qrRefreshS: 20,
    qrTimeout: 0,
    authTimeout: 0,
    autoRefresh: true,
    devtools: false,
    cacheEnabled: false,
    chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
    ]
}

const opsys = process.platform;
if (opsys == "win32" || opsys == "win64") {
    serverOption['executablePath'] = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
} else if (opsys == "linux") {
    serverOption['browserRevision'] = '737027';
} else if (opsys == "darwin") {
    serverOption['executablePath'] = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

const startServer = async (from) => {
    create('Imperial', serverOption)
        .then(client => {
            console.log('[SERVER] Server Started!')

            // Force it to keep the current session
            client.onStateChanged(state => {
                console.log('[State Changed]', state)
                if (state === 'CONFLICT') client.forceRefocus()
            })

            client.onMessage((message) => {
                msgHandler(client, message)
            })
        })
}

async function msgHandler(client, message) {
    try {
        // console.log(message)
        const { type, body, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg } = message
        const { id, pushname } = sender
        const { name } = chat
        const time = moment(t * 1000).format('DD/MM HH:mm:ss')
        const commands = ['#sticker', '#stiker', '#halo', '#nama', '#info', '#aku', '#quotes', '#jokes']
        const cmds = commands.map(x => x + '\\b').join('|')
        const cmd = type === 'chat' ? body.match(new RegExp(cmds, 'gi')) : type === 'image' && caption ? caption.match(new RegExp(cmds, 'gi')) : ''

        if (cmd) {
            if (!isGroupMsg) console.log(color('[EXEC]'), color(time, 'yellow'), color(cmd[0]), 'from', color(pushname))
            if (isGroupMsg) console.log(color('[EXEC]'), color(time, 'yellow'), color(cmd[0]), 'from', color(pushname), 'in', color(name))
            const args = body.trim().split(' ')
            switch (cmd[0]) {
                case '#sticker':
                case '#stiker':
                    if (isMedia) {
                        const mediaData = await decryptMedia(message)
                        const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                        await client.sendImageAsSticker(from, imageBase64)
                    } else if (quotedMsg && quotedMsg.type == 'image') {
                        const mediaData = await decryptMedia(quotedMsg)
                        const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                        await client.sendImageAsSticker(from, imageBase64)
                    } else if (args.length == 2) {
                        var isUrl = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi);
                        const url = args[1]
                        if (url.match(isUrl)) {
                            await client.sendStickerfromUrl(from, url, { method: 'get' })
                                .catch(err => console.log('Caught exception: ', err))
                        } else {
                            client.sendText(from, 'Url yang kamu kirim tidak valid')
                        }
                    } else {
                        client.sendText(from, 'Tidak ada gambar! Untuk membuat sticker kirim gambar dengan caption #stiker')
                    }
                    break
                case '#halo':
                    client.sendText(from, 'Hai')
                    break
                case '#nama':
                    client.sendText(from, 'Hai, Perkenalkan nama ku Ampeyang BOT :)')
                    break
                case '#info':
                    client.sendText(from, 'Aku dibuat oleh YogaSakti diperbaharui oleh IbnuPutra, follow ig @ibnuputraard. Untuk perintah yang bisa digunakan #stiker, #sticker, #halo, #nama, #info, #aku, #quotes, #jokes. v.1.0')
                    break
                case '#aku':
                    var tebakan = [
                        'Kamu mungkin sedang lelah, istirahat sejenak dan cukupkan minum air putih. Semangattt',
                        'Jangan terlalu berharap, jangan terlalu bodoh, jangan terlalu dipikirkan, Hidup terlalu murah hanya untuk memikirkan dia.',
                        'Jangan sedih, aku tau kamu hanya butuh teman ngobrol',
                        'Kamu kuat kok, hanya perlu makan dan minum saja Fighting :)'
                    ]
                    var randomPick = Math.floor(Math.random() * Math.floor(tebakan.length));
                    var pilihan = tebakan[randomPick]
                    client.sendText(from, pilihan)
                    break
                case '#quotes':
                    var tebakan = [
                        'Segala sesuatu memiliki kesudahan, yang sudah berakhir biarlah berlalu dan yakinlah semua akan baik-baik saja.',
                        'Setiap detik sangatlah berharga karena waktu mengetahui banyak hal, termasuk rahasia hati.',
                        'Jika kamu tak menemukan buku yang kamu cari di rak, maka tulislah sendiri.',
                        'Hidup tak selamanya tentang pacar.'
                    ]
                    var randomPick = Math.floor(Math.random() * Math.floor(tebakan.length));
                    var pilihan = tebakan[randomPick]
                    client.sendText(from, pilihan)
                    break
                case '#jokes':
                    var tebakan = [
                        'Aku bukan pemalas. Aku sedang menjalankan mode hemat energi.',
                        'Manusia itu memang susah nyalahin diri sendiri. Leher pegel dibilang salah bantal.',
                        'Jangan sombong kalau jadi atasan. Di pasar, atasan diobral 10 ribu dapat 3.',
                        'Kalau saja mulutmu punya BPKB, pasti udah aku gadaikan.'
                    ]
                    var randomPick = Math.floor(Math.random() * Math.floor(tebakan.length));
                    var pilihan = tebakan[randomPick]
                    client.sendText(from, pilihan)
                    break
                default:
                    client.sendText(from, 'Punten, Maaf, Ngapunten, Sumimasen, Mianhae kulo mboten ngertos hehe :)')
                    break
            }
        } else {
            if (!isGroupMsg) console.log('[RECV]', color(time, 'yellow'), 'Message from', color(pushname))
            if (isGroupMsg) console.log('[RECV]', color(time, 'yellow'), 'Message from', color(pushname), 'in', color(name))
        }
    } catch (err) {
        console.log(color('[ERROR]', 'red'), err)
    }
}

process.on('Something went wrong', function (err) {
    console.log('Caught exception: ', err);
});

function color(text, color) {
    switch (color) {
        case 'red': return '\x1b[31m' + text + '\x1b[0m'
        case 'yellow': return '\x1b[33m' + text + '\x1b[0m'
        default: return '\x1b[32m' + text + '\x1b[0m' // default is green
    }
}

startServer()
