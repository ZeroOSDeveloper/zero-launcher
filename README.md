# Zero Launcher

Hesap gerektirmeyen, çevrimdışı oynanabilen Minecraft Java launcher'ı.
Vanilla (tüm sürümler), Fabric, Forge ve NeoForge desteği vardır.
İstersen Microsoft hesabınla çevrimiçi sunuculara da girebilirsin.

## 1.1 yenilikleri

- **Modrinth sekmesi:** Mod, doku paketi ve shader ara; simge, ad, açıklama ve indirme sayısını gör; tek tıkla kur. Gerekli bağımlılıklar (ör. Fabric API) otomatik iner. İndirilen her dosyanın SHA-1 özeti doğrulanır.
- **Modlar hep güncel:** Kurulu içerik Modrinth'teki en yeni uyumlu sürümle karşılaştırılır. "Kurulu" sekmesinde güncellemeleri tek tek ya da toplu yapabilirsin. Ayarlardaki "Modlar hep güncel kalsın" açıkken **Oyna**'ya her bastığında güncellemeler otomatik uygulanır.
- **Microsoft hesabı ile çevrimiçi oyun** (aşağıdaki kurulum adımlarına bak).
- **Tema özelleştirme:** Obsidyen (varsayılan, 1.0 görünümü), Arduvaz, Gece mavisi, Kâğıt. Vurgu rengi, arka plan resmi ve parlaklığı.
- **7 dil:** Türkçe, English, Deutsch, Español, Français, Русский, Português.
- Ana sayfada Oyna halkasının altında dönen yeni karşılama yazıları.

## Çalıştırma

```bash
npm install
npm start
```

## .exe üretme

Yerelde (Windows): `npm run dist`. `dist/` klasöründe kurulum ve tek dosya exe çıkar.

GitHub'da: Actions sekmesinden "Build Zero Launcher (exe)" iş akışını çalıştır
ya da `git tag v1.1.0 && git push --tags` yap. Exe'ler Releases bölümüne eklenir.

## Microsoft hesabıyla giriş (isteğe bağlı)

Çevrimdışı oyun hesap gerektirmez. Çevrimiçi sunucular için Microsoft girişi gerekir ve
bunun için **senin kendi Azure uygulama kaydın** olmalı. Başkasının kimliğini kullanmak
yasaktır ve çalışmaz.

1. https://portal.azure.com adresinde **Microsoft Entra ID > App registrations > New registration** yolunu izle.
2. Ad: `Zero Launcher`. Desteklenen hesap türü: **Personal Microsoft accounts only**.
3. Kayıttan sonra **Authentication** sayfasında **Allow public client flows** seçeneğini **Yes** yapıp kaydet.
4. **Overview** sayfasındaki **Application (client) ID** değerini kopyala.
5. Mojang, yeni uygulamaların Minecraft API'sini kullanması için onay ister. https://aka.ms/AppRegInfo formunu doldur. Onaylanana kadar giriş "Invalid app registration" hatası verebilir.
6. Zero Launcher'da **Ayarlar > Hesap** bölümüne kimliği yapıştır, **Microsoft ile giriş yap**'a bas, açılan sayfada gösterilen kodu gir.
7. **Oyun modu**ndan Microsoft'u seç.

Yenileme belirteci işletim sisteminin şifreleme deposuyla (Electron safeStorage) saklanır.
İnternet yoksa Microsoft modu otomatik olarak çevrimdışı oynamaya düşer.

## Notlar

- İlk kurulumda oyun dosyaları ve Java için internet gerekir. Sonrasında çevrimdışı çalışır.
- Forge/NeoForge ilk kurulumda resmi kurucuyu çalıştırır, birkaç dakika sürebilir.
- NeoForge, Minecraft 1.20.2 ve üstünü destekler.
- Veriler `%APPDATA%\.zerolauncher` klasöründe tutulur.
- Çevrimdışı mod, premium hesap gerektiren sunuculara girmeyi sağlamaz.
- Minecraft, Mojang/Microsoft'un markasıdır. Bu proje resmi değildir. Oyunu satın alarak geliştiricilere destek ol.

## Lisans

MIT
