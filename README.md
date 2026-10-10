# Zero Launcher

Hesap gerektirmeyen, çevrimdışı oynanabilen Minecraft Java launcher'ı.
Vanilla (tüm sürümler), Fabric, Forge ve NeoForge desteği vardır.

## Özellikler

- Hesapsız çevrimdışı oyun (takma ad yeterli, UUID sabit üretilir)
- Mojang'un tüm Java sürümleri: release, snapshot, beta, alfa
- Fabric, Forge, NeoForge otomatik kurulum
- Doğru Java sürümü otomatik indirilir (Java 8, 17, 21...)
- Bir kez indirilen sürümler internetsiz açılır
- Yükleyiciye göre renk değiştiren halka arayüz

## Çalıştırma

```bash
npm install
npm start
```

## .exe üretme

Yerelde (Windows):

```bash
npm run dist
```

`dist/` klasöründe kurulum (`Setup`) ve tek dosya (`Portable`) exe çıkar.

GitHub'da: repoyu yükle, `git tag v1.0.0 && git push --tags` yap.
Actions exe'yi derleyip Releases bölümüne ekler. İstersen Actions sekmesinden
"Build Zero Launcher (exe)" iş akışını elle de başlatabilirsin.

## Notlar

- İlk kurulumda oyun dosyaları ve Java için internet gerekir. Sonrasında çevrimdışı çalışır.
- Forge/NeoForge ilk kurulumda resmi kurucuyu arka planda çalıştırır, birkaç dakika sürebilir.
- NeoForge, Minecraft 1.20.2 ve üstünü destekler.
- Veriler `%APPDATA%\.zerolauncher` klasöründe tutulur.
- Çevrimdışı mod, premium hesap gerektiren sunuculara girmeyi sağlamaz.
- Minecraft, Mojang/Microsoft'un markasıdır. Bu proje resmi değildir. Oyunu satın alarak geliştiricilere destek ol.

## Lisans

MIT
