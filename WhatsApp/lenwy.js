// Import Module
import "./len.js"
import "./database/Menu/LenwyMenu.js"

import fs from "fs"
import axios from "axios";
import { downloadContentFromMessage, jidNormalizedUser, getContentType } from "@whiskeysockets/baileys"
import path from 'path'

// Track Messages
const processedMessages = new Set()
const groupMetadataCache = new Map();

// Read Json File
function readJSONSync(pathFile) {
    try {
        return JSON.parse(fs.readFileSync(pathFile, 'utf8'))
    } catch {
        return []
    }
}

// Export Handler
export default async (lenwy, m, meta) => {
    const { body, mediaType, sender: originalSender, pushname } = meta 
    const msg = m.messages[0]
    if (!msg.message) return

    const replyJid = msg.key.remoteJid;

    let authJid = originalSender; 

    const key = msg.key;
    if (key.participantAlt) {
      authJid = key.participantAlt;
    } else if (key.remoteJidAlt) {
      authJid = key.remoteJidAlt;
    } 
    
    const sender = authJid; 
    const normalizedSender = jidNormalizedUser(sender);

    // console.log(chalk.yellow(`[DEBUG JID] Sender Original: ${originalSender}`));
    // console.log(chalk.yellow(`[DEBUG JID] Sender Auth (PN): ${sender}`));
    // console.log(chalk.green(`[DEBUG JID] Sender Normal: ${normalizedSender}`));

    if (msg.key.fromMe) return

    // Anti Double
    if (processedMessages.has(msg.key.id)) return
    processedMessages.add(msg.key.id)
    setTimeout(() => processedMessages.delete(msg.key.id), 30000)

    const pplu = fs.readFileSync(globalThis.MenuImage)
    const len = {
        key: {
            participant: `0@s.whatsapp.net`,
            remoteJid: replyJid 
        },
        message: {
            contactMessage: {
                displayName: `${pushname}`,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;Lenwy,;;;\nFN: Lenwy V1.0\nitem1.TEL;waid=${sender.split("@")[0]}:+${sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                jpegThumbnail: pplu,
                thumbnail: pplu,
                sendEphemeral: true
            }
        }
    }

// Multi Prefix + Tanpa Prefix
let usedPrefix = null
    for (const pre of globalThis.prefix) {
        if (body.startsWith(pre)) {
            usedPrefix = pre
            break
        }
    }
    if (!usedPrefix && !globalThis.noprefix) return

    const text = usedPrefix ? body.slice(usedPrefix.length).trim() : body.trim()
    const args = text.split(/\s+/)
    const command = args.shift().toLowerCase()
    const q = text.slice(command.length).trim()

    // Custom Reply
    const lenwyreply = (teks) => lenwy.sendMessage(replyJid, { text: teks }, { quoted: len })

    // Gambar Menu
    const MenuImage = fs.readFileSync(globalThis.MenuImage)

    // Deteksi Grup & Admin
    const isGroup = replyJid.endsWith("@g.us") 

    // Hanya Private
    const IsPriv = !isGroup

    let isAdmin = false
    let isBotAdmin = false

    const GROUP_CACHE_TTL = 5 * 1000 // 5 Detik

    if (isGroup) {
    let metadataData = groupMetadataCache.get(replyJid);

    if (!metadataData || Date.now() - metadataData.time > GROUP_CACHE_TTL) {
        try {
            const metadata = await lenwy.groupMetadata(replyJid);
            groupMetadataCache.set(replyJid, {
                data: metadata,
                time: Date.now()
            });
        metadataData = groupMetadataCache.get(replyJid);
        } catch (e) {
            console.error("Gagal mengambil metadata grup:", e);
        }
    }

    const metadata = metadataData?.data;

      if (metadata) {
        const participants = metadata.participants;
        
        const userParticipant = participants.find(p => p.id === msg.key.participant);
        if (userParticipant) {
          isAdmin = userParticipant.admin === 'admin' || userParticipant.admin === 'superadmin';
        }

        const botJid = jidNormalizedUser(lenwy.user.id);
        const botParticipant = participants.find(p => p.id === botJid);

        if (botParticipant) {
          isBotAdmin = botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin';
        } else {
          isBotAdmin = false;
        }
      }
    }

    // Premium
    const premiumPath = path.join(process.cwd(), 'WhatsApp', 'database', 'premium.json')
    const premiumUsers = readJSONSync(premiumPath)
    const isPremium = premiumUsers.includes(normalizedSender) 

    const CreatorPath = path.join(process.cwd(), 'WhatsApp', 'database', 'creator.json')
    const isCreatorArray = readJSONSync(CreatorPath)
    const isLenwy = isCreatorArray.includes(normalizedSender)
    // Command Yang Diperbolehkan User Free
    const allowedPrivateCommands = ['menu', 'downmenu', 'downloadmenu', 'operasional', 'tt', 'ttdl', 'tiktok']

switch (command) {

case "menu": {
  await lenwy.sendMessage(replyJid, {
    image: MenuImage,
    caption: globalThis.lenwymenu,
    mentions: [normalizedSender]
  }, { quoted: len })
}
break

case "admin": {
    if (!isAdmin) return lenwyreply(globalThis.mess.admin)
    lenwyreply("🎁 *Kamu Adalah Admin*")
}
break

case "group": {
    if (!isGroup) return lenwyreply(globalThis.mess.group)
    lenwyreply("🎁 *Kamu Sedang Berada Di Dalam Grup*")
}
break

case "private": {
    if (!IsPriv) return lenwyreply(globalThis.mess.private)
    lenwyreply("🎁 *Kamu Sedang Berada Di Dalam Private Chat*")
}
break

// Operasional Menu =========================

case "operasional": {
    if (!q) return lenwyreply(globalThis.operasionalmenu), lenwyreply(globalThis.operasionalmenu2);
    let tanggal, jenis, nominal, dibayar, status, keterangan;
    tanggal = new Date().toLocaleDateString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    dibayar = "Putri";
    status = "Reimburse";
    keterangan = ["Bensin dan upah", "Parkir", "Pemindahan produk"]
    let i = 0;
    for (const match of q.matchAll(/(.+?):\s*(\d+(?:,\d+)?)\s*rb/g)) {
        jenis = match[1];
        nominal = Number(match[2].replace(',', '.')) * 1000;
        if (nominal !== '') {
            const data = {
                tanggal: tanggal,
                jenis: jenis,
                nominal: nominal,
                dibayar: dibayar,
                status: status,
                keterangan: keterangan[i]
            };
            const jsonData = JSON.stringify(data);
            const response = await fetch(
                "https://script.google.com/macros/s/AKfycby9A6ZCvYQw-kGwRei-lEgE2TVA62ly2WTSLvXJmi2ArF1h8I7tZ6Jq6CcmTKBFIoFi/exec",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                }
            );
            const result = await response.json();

            console.log(result);
        }
        i++;
    }
    lenwyreply(globalThis.operasionalSukses);
}
break

// Add Order
case "order": {
    if (!q) return lenwyreply(globalThis.orderMsg), lenwyreply(globalThis.addorder);
    const namaMatch = q.match(/Nama:\s*(.+)/i);
    const nama = namaMatch ? namaMatch[1].trim() : null;
    const noHpMatch = q.match(/No HP:\s*(\+?[0-9\s-]+)/i);

    let noHp = noHpMatch
        ? noHpMatch[1].replace(/[\s-]/g, '')
        : null;

    if (noHp) {
        // +62895... → 62895...
        noHp = noHp.replace(/^\+/, '');

        // 0895... → 62895...
        if (noHp.startsWith("0")) {
            noHp = "62" + noHp.substring(1);
        }
    }
    const lokasiMatch = q.match(/Lokasi\s*\(link google map\):\s*(.*)/i);
    const lokasi = lokasiMatch ? lokasiMatch[1].trim() : null;

// Process orders
    const menuKeywords = [
        {
            menu: "Ayam Goreng Golden Brown",
            keywords: ["brown", "golden"]
        },
        {
            menu: "Ayam Goreng Kipas Rempah",
            keywords: ["kipas", "rempah"]
        },
        {
            menu: "Ayam Goreng Terasi Daun Jeruk",
            keywords: ["terasi", "daun jeruk", "jeruk"]
        },
        {
            menu: "Ayam Bakar Honey Savory",
            keywords: ["bakar","madu", "honey", "savory"]
        }
    ];
    
    function fixMenuName(input) {
        const normalized = input.toLowerCase().trim();

        for (const item of menuKeywords) {
            for (const keyword of item.keywords) {
                if (normalized.includes(keyword)) {
                    return item.menu;
                }
            }
        }

        return input; // keep original if no match
    }

    const orders = [...q.matchAll(
        /^\s*\*\s*(.+?)\s*\((\d+)\)\s*$/gm
    )].map(match => ({
        menu: fixMenuName(match[1]),
        jumlah: parseInt(match[2])
    }));

// Input to Spreadsheet
    const response = await fetch("https://script.google.com/macros/s/AKfycbzr0-I6G9UHZj4SimCBGAZso_zfq3ZCRgFiijdigKzlDstCZ-4STu7nm-LwAh1CY3fI/exec", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nama: nama,
            noHp: noHp,
            orders: orders,
            lokasi: lokasi
        })
    });

    console.log("Status:", response.status);

    const responseText = await response.text();

    console.log("Apps Script response:");
    console.log(responseText);
    console.log("ORDERS:");
    console.log(JSON.stringify(orders, null, 2));
}
break

// Download Menu =========================

case "downmenu":
case "downloadmenu": {
  lenwyreply(globalThis.downmenu)
}
break

case "tt": 
case "ttdl":
case "tiktok": {
    if (!q) return lenwyreply("⚠ *Mana Link Tiktoknya?*");
    if (!q.includes("tiktok.com")) return lenwyreply("❌ *Link yang Anda berikan bukan link TikTok.*");

    lenwyreply(globalThis.mess.wait);
    
    try {
        const encodedUrl = encodeURIComponent(q.trim());
        const apiUrl = `https://api.fromscratch.web.id/v1/api/down/tiktok?url=${encodedUrl}`;

        const { data: response } = await axios.get(apiUrl);
        
        if (response.status !== 200 || !response.data?.no_watermark) {
            console.error("API TikTok Error Response:", response);
            return lenwyreply(`❌ *Gagal mengunduh video TikTok:*\nStatus: ${response.message || 'Data tidak ditemukan'}`);
        }

        const videoUrl = response.data.no_watermark;
        
        await lenwy.sendMessage(sender, {
            video: { url: videoUrl },
            caption: `*🎁 Lenwy Tiktok Downloader*\n*[+] Powered by api.fromscratch.web.id*`
        }, { quoted: len }); //
        
    } catch (error) {
        console.error("Error TikTok DL via API:", error.message);
        lenwyreply(`❌ *Gagal mengunduh video TikTok. Coba Link Lain.*\n*Detail Error:* ${error.message}`);
    }
}
break

        default: { // Reply Pesan Tidak Dikenal
           // lenwyreply(globalThis.mess.default) 
        }
    }
}


