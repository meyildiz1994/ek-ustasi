# Mağaza, satın alma ve reklam kurulumu (Aşama 9)

Kod hazır; aşağıdaki hesap ve kimlik adımları yalnızca senin yapabileceğin şeyler. Hepsi bitene kadar
oyun çalışır: mağaza "şu an kullanılamıyor" der, ödüllü reklam Google'ın **test** reklamlarını gösterir.

## 1. Ürünleri mağazalarda aç

App Store Connect (Uygulama İçi Satın Alma) ve Google Play Console'da (Uygulama içi ürünler) aynı
kimliklerle dört ürün oluştur. Kimlikler `config/monetization.ts` içinde:

| Kimlik                   | Tür                          | İçerik                      |
| ------------------------ | ---------------------------- | --------------------------- |
| `ek_ustasi_coins_small`  | Tüketilebilir (consumable)   | 500 altın                   |
| `ek_ustasi_coins_medium` | Tüketilebilir                | 1200 altın                  |
| `ek_ustasi_coins_large`  | Tüketilebilir                | 3000 altın                  |
| `ek_ustasi_no_ads`       | Tüketilemez (non-consumable) | Reklamsız Paket + 500 altın |

Fiyatları mağazanın fiyat katmanlarından seç; oyun fiyatı mağazadan okur, koda fiyat yazılmaz.

## 2. RevenueCat

1. revenuecat.com'da proje aç, iOS ve Android uygulamalarını ekle (paket adı `com.ekustasi.app`).
2. Dört ürünü RevenueCat'e ekle. `ek_ustasi_no_ads` ürününü **`no_ads`** adlı bir entitlement'a bağla.
3. Proje ayarlarından iki **public SDK key**'i al (`appl_…`, `goog_…`) ve EAS'e gizli değişken olarak ekle:

```
eas secret:create --name EXPO_PUBLIC_RC_IOS_KEY --value appl_...
eas secret:create --name EXPO_PUBLIC_RC_ANDROID_KEY --value goog_...
```

Satın almaların doğrulaması RevenueCat sunucularında yapılır (spec §13.2). Oyun her işlemi kimliğiyle
bir kez öder; aynı işlem tekrar gelirse ikinci kez altın vermez.

## 3. AdMob (yalnızca ödüllü reklam)

1. admob.google.com'da iOS ve Android uygulaması oluştur, her biri için bir **Ödüllü** reklam birimi aç.
2. `app.json` içindeki `react-native-google-mobile-ads` eklentisinde `androidAppId` ve `iosAppId` şu an
   Google'ın test kimlikleri. Bunları kendi uygulama kimliklerinle değiştir (`ca-app-pub-…~…`).
3. Reklam birimi kimliklerini EAS'e ekle:

```
eas secret:create --name EXPO_PUBLIC_ADMOB_REWARDED_IOS --value ca-app-pub-.../...
eas secret:create --name EXPO_PUBLIC_ADMOB_REWARDED_ANDROID --value ca-app-pub-.../...
```

Geliştirme derlemelerinde her zaman test reklamı gösterilir (gerçek reklama kendin tıklarsan AdMob
hesabın askıya alınabilir).

4. AdMob → Gizlilik ve mesajlaşma: **GDPR (AB) mesajını** oluştur. Oyun açılışta değil, oyuncu ilk kez
   reklam izlemek istediğinde bu formu (UMP) gösterir; ardından iOS'ta ATT izin penceresi gelir. İzin
   verilmezse reklamlar kişiselleştirilmemiş olarak gösterilir.

## 4. Gizlilik ve iletişim

Ayarlar'daki "Gizlilik politikası" ve "İletişim" satırları şu an "Yakında" diyor. Bağlantılar hazır
olunca EAS'e ekle: `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_CONTACT_EMAIL`. Mağazalar gizlilik politikası
bağlantısı istiyor; reklam SDK'sı olduğu için App Store'da "Gizlilik etiketleri" de doldurulmalı.

## 5. Test

Bu paketler yerel kod içerdiği için **Expo Go'da çalışmaz**; bir geliştirme derlemesi gerekir:

```
eas build --profile development --platform ios   # ya da android
```

- iOS: App Store Connect'te bir Sandbox test hesabı aç, telefonda bu hesapla satın al ve geri yükle.
- Android: Play Console'da iç test kanalı aç, lisans test hesabını ekle.
- Ödüllü reklam: Mağaza → "Reklam izle: +25 altın" test reklamını göstermeli, sonuna kadar izleyince
  altın gelmeli; yarıda kapatınca gelmemeli.

Spec'in Aşama 9 kabul ölçütü bu üç testtir; bulut ortamında gerçek mağaza olmadığı için ben
yapamıyorum.
