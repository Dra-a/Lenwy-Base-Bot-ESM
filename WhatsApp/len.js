// Import Module
import { fileURLToPath } from 'url';
import path from "path";
import fs from "fs";

// Path ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom Prefix
globalThis.prefix = ['#', '.', '!', '/']; // Multi Prefix (Custom Prefix)
globalThis.noprefix = false; // True = Tanpa Prefix, False = Pakai Prefix 

// Custom Menu Image
globalThis.MenuImage = path.join(__dirname, "./database/image/lenwy.jpeg"); // Ganti Dengan Path Gambar Menu

// Custom Message
globalThis.mess = {
    wait: '🤍 *One Moment, Please*',
    error: '⚠ *Gagal Saat Melakukan Proses*',
    default: '📑 *Perintah Tidak Dikenali*',
    admin: '⚠ *Perintah Ini Hanya Bisa Digunakan Oleh Admin*',
    group: '⚠ *Perintah Ini Hanya Bisa Digunakan Di Dalam Grup*',
    private: '⚠ *Perintah Ini Hanya Bisa Digunakan Di Dalam Private Chat*',
    order: '⚠ *Kamu Hanya Bisa Melakukan Pembayaran Di Private Chat*',
    creator: '⚠ *Perintah Ini Hanya Bisa Digunakan Oleh Owner*',
};