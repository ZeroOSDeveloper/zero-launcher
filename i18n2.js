/* 1.1 yeni metinleri: ana sayfa yazıları, Microsoft hesabı, mod güncellemeleri */
(() => {
  const D = window.I18N_DATA.D;
  const add = (lang, o) => Object.assign(D[lang], o);

  add('en', {
    'hero.h': ['Start from zero.', 'Your world is waiting.', 'Build. Dig. Discover.', 'Reset the limits.', 'One click away.'],
    'hero.s': [
      'No account, no password, no waiting. One click into an endless world.',
      'Every version, every mod loader, all inside a single ring.',
      'No internet, no problem. Installed versions launch offline.',
      'Fabric, Forge or NeoForge: write your own rules with mods.',
      'From dark caves to endless forests, the journey starts with Play.'
    ],
    'hero.busyH': 'Shaping your world…', 'hero.runH': 'Good luck out there.',
    'p.updates': 'Updating mods',
    'mods.update': 'Update', 'mods.updateAll': 'Update all ({n})', 'mods.updAvail': 'Update to {v}', 'mods.upToDate': 'Up to date',
    'mods.updated': '{n} updated.', 'mods.updNone': 'Everything is up to date.', 'mods.checking': 'Checking for updates…',
    'set.autoUpd': 'Keep mods up to date', 'set.autoUpdD': 'Each time you press Play, installed mods, packs and shaders update to their newest Modrinth version.',
    'set.acc': 'Account',
    'ms.mode': 'Play mode', 'ms.desc': 'Offline needs no account. Microsoft lets you join online servers with your real profile.',
    'ms.offline': 'Offline', 'ms.online': 'Microsoft',
    'ms.signin': 'Sign in with Microsoft', 'ms.signout': 'Sign out', 'ms.none': 'Not signed in', 'ms.signed': 'Signed in as {n}',
    'ms.clientId': 'Azure application (client) ID', 'ms.clientIdD': 'Required for Microsoft sign-in. Create a free app registration and paste its ID here. The README explains every step.',
    'ms.needId': 'Paste your Azure client ID in Settings first.', 'ms.needSignin': 'Sign in with Microsoft in Settings, or switch to Offline.',
    'ms.codeTitle': 'Sign in with Microsoft', 'ms.codeBody': 'Open the Microsoft page and enter this code.',
    'ms.copy': 'Copy code', 'ms.open': 'Open page', 'ms.waiting': 'Waiting for you to finish signing in…', 'ms.cancel': 'Cancel',
    'ms.ok': 'Signed in as {n}.', 'ms.noGame': 'This Microsoft account does not own Minecraft: Java Edition.',
    'ms.fail': 'Sign-in failed: {e}', 'ms.fallback': 'Could not reach Microsoft. Playing offline instead.'
  });

  add('tr', {
    'hero.h': ['Sıfırdan başla.', 'Dünyan seni bekliyor.', 'Kur. Kaz. Keşfet.', 'Sınırları sıfırla.', 'Bir tık uzağında.'],
    'hero.s': [
      'Hesap yok, şifre yok, bekleme yok. Tek tıkla sonsuz bir dünyaya adım at.',
      'Her sürüm, her mod yükleyici, hepsi tek bir halkanın içinde.',
      'İnternet yoksa sorun yok. Kurulu sürümler çevrimdışı da açılır.',
      'Fabric, Forge ya da NeoForge: modlarınla kendi kurallarını yaz.',
      'Karanlık mağaralardan uçsuz bucaksız ormanlara, yolculuk Oyna ile başlar.'
    ],
    'hero.busyH': 'Dünyan şekilleniyor…', 'hero.runH': 'Bol şans, maceracı.',
    'p.updates': 'Modlar güncelleniyor',
    'mods.update': 'Güncelle', 'mods.updateAll': 'Tümünü güncelle ({n})', 'mods.updAvail': '{v} sürümüne güncelle', 'mods.upToDate': 'Güncel',
    'mods.updated': '{n} öğe güncellendi.', 'mods.updNone': 'Her şey güncel.', 'mods.checking': 'Güncellemeler denetleniyor…',
    'set.autoUpd': 'Modlar hep güncel kalsın', 'set.autoUpdD': 'Oyna\'ya her bastığında kurulu mod, paket ve shader\'lar Modrinth\'teki en yeni sürümlerine güncellenir.',
    'set.acc': 'Hesap',
    'ms.mode': 'Oyun modu', 'ms.desc': 'Çevrimdışı mod hesap istemez. Microsoft ile gerçek profilinle çevrimiçi sunuculara girersin.',
    'ms.offline': 'Çevrimdışı', 'ms.online': 'Microsoft',
    'ms.signin': 'Microsoft ile giriş yap', 'ms.signout': 'Çıkış yap', 'ms.none': 'Giriş yapılmadı', 'ms.signed': '{n} olarak giriş yapıldı',
    'ms.clientId': 'Azure uygulama (istemci) kimliği', 'ms.clientIdD': 'Microsoft girişi için gerekli. Ücretsiz bir uygulama kaydı oluşturup kimliğini buraya yapıştır. README her adımı anlatıyor.',
    'ms.needId': 'Önce Ayarlar\'a Azure istemci kimliğini yapıştır.', 'ms.needSignin': 'Ayarlar\'dan Microsoft ile giriş yap ya da Çevrimdışı\'na geç.',
    'ms.codeTitle': 'Microsoft ile giriş', 'ms.codeBody': 'Microsoft sayfasını aç ve bu kodu gir.',
    'ms.copy': 'Kodu kopyala', 'ms.open': 'Sayfayı aç', 'ms.waiting': 'Girişi tamamlaman bekleniyor…', 'ms.cancel': 'Vazgeç',
    'ms.ok': '{n} olarak giriş yapıldı.', 'ms.noGame': 'Bu Microsoft hesabında Minecraft: Java Edition yok.',
    'ms.fail': 'Giriş başarısız: {e}', 'ms.fallback': 'Microsoft\'a ulaşılamadı. Çevrimdışı oynanıyor.'
  });

  add('de', {
    'hero.h': ['Fang bei null an.', 'Deine Welt wartet.', 'Bauen. Graben. Entdecken.', 'Setz die Grenzen zurück.', 'Nur einen Klick entfernt.'],
    'hero.s': [
      'Kein Konto, kein Passwort, kein Warten. Ein Klick in eine endlose Welt.',
      'Jede Version, jeder Mod-Loader, alles in einem einzigen Ring.',
      'Kein Internet? Kein Problem. Installierte Versionen starten offline.',
      'Fabric, Forge oder NeoForge: Schreib mit Mods deine eigenen Regeln.',
      'Von dunklen Höhlen bis zu endlosen Wäldern: Die Reise beginnt mit Spielen.'
    ],
    'hero.busyH': 'Deine Welt entsteht…', 'hero.runH': 'Viel Glück da draußen.',
    'p.updates': 'Mods werden aktualisiert',
    'mods.update': 'Aktualisieren', 'mods.updateAll': 'Alle aktualisieren ({n})', 'mods.updAvail': 'Auf {v} aktualisieren', 'mods.upToDate': 'Aktuell',
    'mods.updated': '{n} aktualisiert.', 'mods.updNone': 'Alles ist aktuell.', 'mods.checking': 'Suche nach Updates…',
    'set.autoUpd': 'Mods immer aktuell halten', 'set.autoUpdD': 'Bei jedem Klick auf Spielen werden installierte Mods, Pakete und Shader auf die neueste Modrinth-Version gebracht.',
    'set.acc': 'Konto',
    'ms.mode': 'Spielmodus', 'ms.desc': 'Offline braucht kein Konto. Mit Microsoft betrittst du Online-Server mit deinem echten Profil.',
    'ms.offline': 'Offline', 'ms.online': 'Microsoft',
    'ms.signin': 'Mit Microsoft anmelden', 'ms.signout': 'Abmelden', 'ms.none': 'Nicht angemeldet', 'ms.signed': 'Angemeldet als {n}',
    'ms.clientId': 'Azure-Anwendungs-ID (Client-ID)', 'ms.clientIdD': 'Für die Microsoft-Anmeldung nötig. Erstelle eine kostenlose App-Registrierung und füge die ID hier ein. Die README erklärt jeden Schritt.',
    'ms.needId': 'Füge zuerst deine Azure-Client-ID in den Einstellungen ein.', 'ms.needSignin': 'Melde dich in den Einstellungen mit Microsoft an oder wechsle zu Offline.',
    'ms.codeTitle': 'Mit Microsoft anmelden', 'ms.codeBody': 'Öffne die Microsoft-Seite und gib diesen Code ein.',
    'ms.copy': 'Code kopieren', 'ms.open': 'Seite öffnen', 'ms.waiting': 'Warte auf den Abschluss der Anmeldung…', 'ms.cancel': 'Abbrechen',
    'ms.ok': 'Angemeldet als {n}.', 'ms.noGame': 'Dieses Microsoft-Konto besitzt Minecraft: Java Edition nicht.',
    'ms.fail': 'Anmeldung fehlgeschlagen: {e}', 'ms.fallback': 'Microsoft nicht erreichbar. Es wird offline gespielt.'
  });

  add('es', {
    'hero.h': ['Empieza desde cero.', 'Tu mundo te espera.', 'Construye. Cava. Descubre.', 'Rompe los límites.', 'A un clic de distancia.'],
    'hero.s': [
      'Sin cuenta, sin contraseña, sin esperas. Un clic y entras a un mundo infinito.',
      'Cada versión, cada cargador de mods, todo dentro de un solo anillo.',
      'Sin internet, sin problema. Las versiones instaladas arrancan sin conexión.',
      'Fabric, Forge o NeoForge: escribe tus propias reglas con mods.',
      'De cuevas oscuras a bosques infinitos, el viaje empieza con Jugar.'
    ],
    'hero.busyH': 'Dando forma a tu mundo…', 'hero.runH': 'Buena suerte ahí fuera.',
    'p.updates': 'Actualizando mods',
    'mods.update': 'Actualizar', 'mods.updateAll': 'Actualizar todo ({n})', 'mods.updAvail': 'Actualizar a {v}', 'mods.upToDate': 'Al día',
    'mods.updated': '{n} actualizados.', 'mods.updNone': 'Todo está al día.', 'mods.checking': 'Buscando actualizaciones…',
    'set.autoUpd': 'Mantener los mods al día', 'set.autoUpdD': 'Cada vez que pulsas Jugar, los mods, paquetes y shaders instalados se actualizan a su última versión de Modrinth.',
    'set.acc': 'Cuenta',
    'ms.mode': 'Modo de juego', 'ms.desc': 'Sin conexión no necesita cuenta. Con Microsoft entras a servidores en línea con tu perfil real.',
    'ms.offline': 'Sin conexión', 'ms.online': 'Microsoft',
    'ms.signin': 'Iniciar sesión con Microsoft', 'ms.signout': 'Cerrar sesión', 'ms.none': 'Sin iniciar sesión', 'ms.signed': 'Sesión iniciada como {n}',
    'ms.clientId': 'ID de aplicación (cliente) de Azure', 'ms.clientIdD': 'Necesario para iniciar sesión con Microsoft. Crea un registro de aplicación gratuito y pega aquí su ID. El README explica cada paso.',
    'ms.needId': 'Pega primero tu ID de cliente de Azure en Ajustes.', 'ms.needSignin': 'Inicia sesión con Microsoft en Ajustes o cambia a Sin conexión.',
    'ms.codeTitle': 'Iniciar sesión con Microsoft', 'ms.codeBody': 'Abre la página de Microsoft e introduce este código.',
    'ms.copy': 'Copiar código', 'ms.open': 'Abrir página', 'ms.waiting': 'Esperando a que termines de iniciar sesión…', 'ms.cancel': 'Cancelar',
    'ms.ok': 'Sesión iniciada como {n}.', 'ms.noGame': 'Esta cuenta de Microsoft no tiene Minecraft: Java Edition.',
    'ms.fail': 'Error al iniciar sesión: {e}', 'ms.fallback': 'No se pudo conectar con Microsoft. Se jugará sin conexión.'
  });

  add('fr', {
    'hero.h': ['Repars de zéro.', 'Ton monde t\'attend.', 'Construis. Creuse. Explore.', 'Repousse les limites.', 'À un clic d\'ici.'],
    'hero.s': [
      'Pas de compte, pas de mot de passe, pas d\'attente. Un clic et tu entres dans un monde infini.',
      'Chaque version, chaque chargeur de mods, tout dans un seul anneau.',
      'Pas d\'internet ? Aucun souci. Les versions installées se lancent hors ligne.',
      'Fabric, Forge ou NeoForge : écris tes propres règles avec des mods.',
      'Des grottes obscures aux forêts sans fin, le voyage commence avec Jouer.'
    ],
    'hero.busyH': 'Ton monde prend forme…', 'hero.runH': 'Bonne chance là-bas.',
    'p.updates': 'Mise à jour des mods',
    'mods.update': 'Mettre à jour', 'mods.updateAll': 'Tout mettre à jour ({n})', 'mods.updAvail': 'Passer à {v}', 'mods.upToDate': 'À jour',
    'mods.updated': '{n} mis à jour.', 'mods.updNone': 'Tout est à jour.', 'mods.checking': 'Recherche de mises à jour…',
    'set.autoUpd': 'Garder les mods à jour', 'set.autoUpdD': 'À chaque clic sur Jouer, les mods, packs et shaders installés passent à leur dernière version Modrinth.',
    'set.acc': 'Compte',
    'ms.mode': 'Mode de jeu', 'ms.desc': 'Hors ligne ne demande aucun compte. Avec Microsoft, tu rejoins les serveurs en ligne avec ton vrai profil.',
    'ms.offline': 'Hors ligne', 'ms.online': 'Microsoft',
    'ms.signin': 'Se connecter avec Microsoft', 'ms.signout': 'Se déconnecter', 'ms.none': 'Non connecté', 'ms.signed': 'Connecté en tant que {n}',
    'ms.clientId': 'ID d\'application (client) Azure', 'ms.clientIdD': 'Requis pour la connexion Microsoft. Crée un enregistrement d\'application gratuit et colle son ID ici. Le README détaille chaque étape.',
    'ms.needId': 'Colle d\'abord ton ID client Azure dans les Réglages.', 'ms.needSignin': 'Connecte-toi avec Microsoft dans les Réglages ou passe en Hors ligne.',
    'ms.codeTitle': 'Connexion Microsoft', 'ms.codeBody': 'Ouvre la page Microsoft et saisis ce code.',
    'ms.copy': 'Copier le code', 'ms.open': 'Ouvrir la page', 'ms.waiting': 'En attente de la fin de ta connexion…', 'ms.cancel': 'Annuler',
    'ms.ok': 'Connecté en tant que {n}.', 'ms.noGame': 'Ce compte Microsoft ne possède pas Minecraft : Java Edition.',
    'ms.fail': 'Échec de la connexion : {e}', 'ms.fallback': 'Microsoft est injoignable. Lancement hors ligne.'
  });

  add('ru', {
    'hero.h': ['Начни с нуля.', 'Твой мир ждёт.', 'Строй. Копай. Открывай.', 'Сними все ограничения.', 'Всего один клик.'],
    'hero.s': [
      'Без аккаунта, без пароля, без ожидания. Один клик, и ты в бескрайнем мире.',
      'Любая версия, любой загрузчик модов, всё внутри одного кольца.',
      'Нет интернета? Не беда. Установленные версии запускаются офлайн.',
      'Fabric, Forge или NeoForge: пиши собственные правила с помощью модов.',
      'От тёмных пещер до бескрайних лесов: путь начинается с кнопки «Играть».'
    ],
    'hero.busyH': 'Твой мир обретает форму…', 'hero.runH': 'Удачи там, искатель.',
    'p.updates': 'Обновление модов',
    'mods.update': 'Обновить', 'mods.updateAll': 'Обновить всё ({n})', 'mods.updAvail': 'Обновить до {v}', 'mods.upToDate': 'Актуально',
    'mods.updated': 'Обновлено: {n}.', 'mods.updNone': 'Всё актуально.', 'mods.checking': 'Проверка обновлений…',
    'set.autoUpd': 'Держать моды в актуальном состоянии', 'set.autoUpdD': 'При каждом нажатии «Играть» установленные моды, паки и шейдеры обновляются до новейшей версии на Modrinth.',
    'set.acc': 'Аккаунт',
    'ms.mode': 'Режим игры', 'ms.desc': 'Офлайн не требует аккаунта. С Microsoft ты заходишь на онлайн-серверы под настоящим профилем.',
    'ms.offline': 'Офлайн', 'ms.online': 'Microsoft',
    'ms.signin': 'Войти через Microsoft', 'ms.signout': 'Выйти', 'ms.none': 'Вход не выполнен', 'ms.signed': 'Вход выполнен: {n}',
    'ms.clientId': 'Идентификатор приложения (клиента) Azure', 'ms.clientIdD': 'Нужен для входа через Microsoft. Создай бесплатную регистрацию приложения и вставь сюда её ID. В README описан каждый шаг.',
    'ms.needId': 'Сначала вставь идентификатор клиента Azure в настройках.', 'ms.needSignin': 'Войди через Microsoft в настройках или переключись на Офлайн.',
    'ms.codeTitle': 'Вход через Microsoft', 'ms.codeBody': 'Открой страницу Microsoft и введи этот код.',
    'ms.copy': 'Копировать код', 'ms.open': 'Открыть страницу', 'ms.waiting': 'Ждём, пока ты завершишь вход…', 'ms.cancel': 'Отмена',
    'ms.ok': 'Вход выполнен: {n}.', 'ms.noGame': 'На этом аккаунте Microsoft нет Minecraft: Java Edition.',
    'ms.fail': 'Не удалось войти: {e}', 'ms.fallback': 'Не удалось связаться с Microsoft. Запуск в офлайн-режиме.'
  });

  add('pt', {
    'hero.h': ['Comece do zero.', 'Seu mundo te espera.', 'Construa. Cave. Descubra.', 'Quebre os limites.', 'A um clique de distância.'],
    'hero.s': [
      'Sem conta, sem senha, sem espera. Um clique e você entra em um mundo sem fim.',
      'Cada versão, cada carregador de mods, tudo dentro de um único anel.',
      'Sem internet, sem problema. As versões instaladas abrem offline.',
      'Fabric, Forge ou NeoForge: escreva suas próprias regras com mods.',
      'De cavernas escuras a florestas infinitas, a jornada começa com Jogar.'
    ],
    'hero.busyH': 'Dando forma ao seu mundo…', 'hero.runH': 'Boa sorte lá fora.',
    'p.updates': 'Atualizando mods',
    'mods.update': 'Atualizar', 'mods.updateAll': 'Atualizar tudo ({n})', 'mods.updAvail': 'Atualizar para {v}', 'mods.upToDate': 'Atualizado',
    'mods.updated': '{n} atualizados.', 'mods.updNone': 'Tudo está atualizado.', 'mods.checking': 'Procurando atualizações…',
    'set.autoUpd': 'Manter os mods atualizados', 'set.autoUpdD': 'Toda vez que você clica em Jogar, mods, pacotes e shaders instalados são atualizados para a versão mais recente do Modrinth.',
    'set.acc': 'Conta',
    'ms.mode': 'Modo de jogo', 'ms.desc': 'Offline não precisa de conta. Com a Microsoft você entra em servidores online com seu perfil real.',
    'ms.offline': 'Offline', 'ms.online': 'Microsoft',
    'ms.signin': 'Entrar com a Microsoft', 'ms.signout': 'Sair', 'ms.none': 'Sem login', 'ms.signed': 'Conectado como {n}',
    'ms.clientId': 'ID do aplicativo (cliente) do Azure', 'ms.clientIdD': 'Necessário para entrar com a Microsoft. Crie um registro de aplicativo gratuito e cole o ID aqui. O README explica cada passo.',
    'ms.needId': 'Cole primeiro o ID de cliente do Azure nas Configurações.', 'ms.needSignin': 'Entre com a Microsoft nas Configurações ou mude para Offline.',
    'ms.codeTitle': 'Entrar com a Microsoft', 'ms.codeBody': 'Abra a página da Microsoft e digite este código.',
    'ms.copy': 'Copiar código', 'ms.open': 'Abrir página', 'ms.waiting': 'Aguardando você concluir o login…', 'ms.cancel': 'Cancelar',
    'ms.ok': 'Conectado como {n}.', 'ms.noGame': 'Esta conta Microsoft não possui Minecraft: Java Edition.',
    'ms.fail': 'Falha no login: {e}', 'ms.fallback': 'Não foi possível acessar a Microsoft. Jogando offline.'
  });
})();
