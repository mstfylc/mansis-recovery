# Mansis Desktop Printing Inceleme - 2026-06-15

## Ozet

- Masaustu uygulama: `Fundra Desktop` / version `1.0.9`.
- Installer: `Fundra.Desktop.Setup.1.0.9.exe`.
- SHA256: `7A23BEB3D824C224A339E7E07D430CD575856A13CA5AA5C545B9D6C44D2E84EF`.
- Installer imzali degil (`Authenticode: NotSigned`).
- Uygulama Electron tabanli.
- Default API URL: `https://backend.mansis.com.tr`.
- Masaustu yazdirma akisi backend `Socket.IO` uzerinden calisiyor.

## Masaustu Uygulama Akisi

- Login endpoint: `POST /auth/login`.
- Refresh endpoint: `GET /auth/refresh`.
- Yazdirma sonuc endpointi: `POST /api/print/result`.
- Socket baglantisi: `socket.io-client` ile `https://backend.mansis.com.tr`.
- Socket transport: yalniz `websocket`.
- Dinlenen yazdirma eventleri:
  - `printTicket`
  - `printEntranceTicket`
  - `printTableCheck`

## Backend Yazdirma Gateway

- Gateway: `/usr/src/app/dist/src/printer/printer.gateway.js`.
- Auth: Socket handshake icinde JWT token bekliyor.
- Branch izolasyonu: token icindeki `branchId` ile `branch-{branchId}` odasina aliyor.
- Lisans kontrolu: branch icin `desktop_app` ozelligi aktif olmali.
- Backend eventleri ilgili branch odasina emit ediyor.

## Uygulanan Koruma

- Backend nginx icinde `/socket.io/` icin ayri location eklendi.
- Bu yol genel API rate limitinden ayrildi.
- `proxy_read_timeout` ve `proxy_send_timeout` 1 saat yapildi.
- Uygulama container'i veya PM2 servisi durdurulmadi.
- Nginx sadece config testinden sonra reload edildi.

## Dogrulama

- `https://backend.mansis.com.tr/application-version`: 200 OK.
- `https://backend.mansis.com.tr/socket.io/?EIO=4&transport=polling`: 200 OK.
- `mansis-backend`: running.
- PM2 `index`: online.

## Kritik Notlar

- Masaustu kullanicilarin mevcut refresh/access tokenlari JWT secret rotasyonu nedeniyle gecersiz kalmis olabilir; bu kullanicilarin tekrar login olmasi gerekebilir.
- Masaustu uygulama imzasiz oldugu icin uzun vadede code signing zorunlu hale getirilmeli.
- Auto-update `Uyanik-app/uyanik-desktop` GitHub private release mekanizmasina bakiyor. GitHub erisimi geri alindiginda eski tokenlar revoke edilmeli ve release yetkileri temizlenmeli.
- `desktop_releases` DB tablosu su anda write-block trigger ile korunuyor; yeni masaustu release yayinlamak icin bilincli DB override gerekecek.
