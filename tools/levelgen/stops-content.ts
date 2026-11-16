/**
 * Hand-written stop content: a one-sentence original introduction, scene layers and time of day.
 * Layers are generic forms (no real building is copied); see tools/scenes/preview.html.
 */
export type Layer =
  | 'mountains'
  | 'snowPeaks'
  | 'hills'
  | 'plateau'
  | 'sea'
  | 'lake'
  | 'river'
  | 'waterfall'
  | 'city'
  | 'domes'
  | 'minarets'
  | 'tower'
  | 'bridge'
  | 'castle'
  | 'ruins'
  | 'columns'
  | 'rockSpires'
  | 'balloons'
  | 'trees'
  | 'pines'
  | 'terraces'
  | 'vineyards'
  | 'fields'
  | 'palms'
  | 'desert'
  | 'boats'
  | 'lighthouse'
  | 'windmills'
  | 'houses'
  | 'skyscrapers'
  | 'birds'
  | 'clouds'
  | 'stars'
  | 'moon'
  | 'snow';

export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';

export interface StopContent {
  intro: string;
  layers: Layer[];
  time: TimeOfDay;
}

export const STOP_CONTENT: Readonly<Record<number, StopContent>> = {
  // Marmara
  34: {
    intro:
      'İki kıtayı birbirine bağlayan boğazı, tepelerdeki kubbeleri ve vapurlarıyla yolculuğun ilk durağı.',
    layers: ['sea', 'city', 'domes', 'minarets', 'bridge', 'boats', 'birds'],
    time: 'sunset',
  },
  22: {
    intro: 'Nehirlerin kucakladığı sınır şehri; taş köprüleri ve geniş kubbeleriyle tanınır.',
    layers: ['river', 'bridge', 'domes', 'minarets', 'fields', 'trees'],
    time: 'day',
  },
  16: {
    intro: 'Karlı bir dağın eteğine yaslanmış, yeşili ve ipek yoluyla anılan eski başkent.',
    layers: ['snowPeaks', 'city', 'domes', 'trees', 'clouds'],
    time: 'day',
  },
  17: {
    intro: 'Boğazın kıyısında, tarihin ve denizin iç içe geçtiği bir liman kenti.',
    layers: ['sea', 'hills', 'castle', 'boats', 'lighthouse'],
    time: 'sunset',
  },
  10: {
    intro: 'İki denize birden kıyısı olan, zeytinlikleri ve adalarıyla geniş bir kent.',
    layers: ['sea', 'hills', 'trees', 'houses', 'boats'],
    time: 'day',
  },
  41: {
    intro: 'Körfezin iki yakasına yayılmış, sanayisi ve ormanlık tepeleriyle hareketli bir şehir.',
    layers: ['sea', 'hills', 'city', 'bridge', 'pines'],
    time: 'dawn',
  },
  77: {
    intro: 'Kaplıcaları ve çiçek bahçeleriyle bilinen, körfezin küçük ve sakin kıyısı.',
    layers: ['sea', 'hills', 'trees', 'houses', 'clouds'],
    time: 'day',
  },
  54: {
    intro: 'Nehirleri, gölü ve fındıklı yeşil yamaçlarıyla serin bir durak.',
    layers: ['lake', 'river', 'hills', 'trees', 'birds'],
    time: 'day',
  },
  59: {
    intro: 'Bağları ve uzun kumsallarıyla denize açılan bir ova kenti.',
    layers: ['sea', 'vineyards', 'fields', 'houses', 'windmills'],
    time: 'sunset',
  },
  39: {
    intro: "Sınıra yakın ormanları ve sessiz köyleriyle Trakya'nın yeşil köşesi.",
    layers: ['hills', 'pines', 'trees', 'fields', 'houses'],
    time: 'dawn',
  },
  11: {
    intro: 'Vadilerin arasında, el sanatları ve dut ağaçlarıyla anılan küçük bir şehir.',
    layers: ['hills', 'river', 'trees', 'houses'],
    time: 'day',
  },
  // Ege
  35: {
    intro: "Körfezinde günbatımı izlenen, palmiyeli kordonu ve saat kulesiyle Ege'nin incisi.",
    layers: ['sea', 'palms', 'tower', 'city', 'boats', 'birds'],
    time: 'sunset',
  },
  48: {
    intro: 'Beyaz evleri, koyları ve turkuaz denizi olan masmavi bir kıyı.',
    layers: ['sea', 'hills', 'houses', 'boats', 'windmills'],
    time: 'day',
  },
  9: {
    intro: 'İncir bahçeleri ve antik sütunlarıyla bereketli bir ova.',
    layers: ['fields', 'columns', 'ruins', 'trees', 'hills'],
    time: 'day',
  },
  20: {
    intro: 'Bembeyaz kireç teraslarından ılık suların aktığı bir kent.',
    layers: ['terraces', 'hills', 'ruins', 'trees'],
    time: 'dawn',
  },
  45: {
    intro: 'Üzüm bağları ve efsanevi dağıyla bilinen verimli bir ova kenti.',
    layers: ['mountains', 'vineyards', 'fields', 'houses'],
    time: 'day',
  },
  3: {
    intro: 'Yüksek bir kayanın üstündeki kalesiyle uzaktan seçilen bir şehir.',
    layers: ['castle', 'rockSpires', 'plateau', 'houses', 'fields'],
    time: 'sunset',
  },
  43: {
    intro: 'Çinileri ve renkli seramikleriyle tanınan bir zanaat şehri.',
    layers: ['hills', 'castle', 'houses', 'trees'],
    time: 'day',
  },
  64: {
    intro: "Halıları ve derin kanyonuyla iç Ege'nin sakin kenti.",
    layers: ['plateau', 'river', 'houses', 'fields'],
    time: 'dawn',
  },
  // Akdeniz
  7: {
    intro: 'Dağların denize indiği, eski limanı ve uzun sahilleriyle güneşli bir kent.',
    layers: ['sea', 'mountains', 'palms', 'tower', 'boats'],
    time: 'day',
  },
  33: {
    intro: 'Narenciye bahçeleri, sahil boyu kaleleri ve geniş limanıyla sıcak bir kıyı.',
    layers: ['sea', 'castle', 'palms', 'fields', 'boats'],
    time: 'sunset',
  },
  31: {
    intro: 'Mutfağı, mozaikleri ve eski taş sokaklarıyla tanınan bir sofra kenti.',
    layers: ['mountains', 'river', 'houses', 'domes', 'trees'],
    time: 'sunset',
  },
  1: {
    intro: 'Bereketli ovasından geçen nehri ve uzun taş köprüsüyle bilinen büyük bir şehir.',
    layers: ['river', 'bridge', 'fields', 'city', 'palms'],
    time: 'day',
  },
  32: {
    intro: 'Bahar gelince gül tarlalarının pembeye boyandığı göller bölgesi kenti.',
    layers: ['lake', 'fields', 'mountains', 'houses'],
    time: 'dawn',
  },
  15: {
    intro: 'Turkuaz gölü ve beyaz kumsallı kıyılarıyla serin bir göl kenti.',
    layers: ['lake', 'hills', 'houses', 'birds'],
    time: 'day',
  },
  46: {
    intro: 'Dondurması ve bakır işçiliğiyle tanınan, dağların arasında bir şehir.',
    layers: ['mountains', 'castle', 'houses', 'trees'],
    time: 'day',
  },
  80: {
    intro: "Yerfıstığı tarlaları ve ormanlık dağlarıyla Çukurova'nın genç kenti.",
    layers: ['fields', 'hills', 'trees', 'houses'],
    time: 'sunset',
  },
  // İç Anadolu
  50: {
    intro:
      'Peri bacaları, kayaya oyulmuş evleri ve sabah gökyüzündeki balonlarıyla masalsı bir vadi.',
    layers: ['rockSpires', 'balloons', 'plateau', 'houses', 'clouds'],
    time: 'dawn',
  },
  6: {
    intro: 'Bozkırın ortasında yükselen, kalesi ve geniş caddeleriyle başkent.',
    layers: ['plateau', 'city', 'castle', 'tower', 'clouds'],
    time: 'day',
  },
  42: {
    intro: 'Uçsuz ovası, yeşil kubbesi ve semazenleriyle bilinen huzurlu bir şehir.',
    layers: ['plateau', 'domes', 'minarets', 'fields'],
    time: 'sunset',
  },
  26: {
    intro: 'Nehrinde gondolların süzüldüğü, öğrencilerle dolu canlı bir kent.',
    layers: ['river', 'bridge', 'city', 'trees'],
    time: 'night',
  },
  38: {
    intro: 'Karlı volkanik dağın gölgesinde, mantısı ve kayak pistleriyle bilinen şehir.',
    layers: ['snowPeaks', 'plateau', 'city', 'domes'],
    time: 'day',
  },
  58: {
    intro: 'Taş işçiliğiyle süslü kapıları ve yüksek yaylalarıyla serin bir kent.',
    layers: ['plateau', 'domes', 'houses', 'snow'],
    time: 'dawn',
  },
  68: {
    intro: 'Derin vadileri ve ovadan yükselen volkanik dağıyla kervan yolunun durağı.',
    layers: ['mountains', 'river', 'plateau', 'ruins'],
    time: 'sunset',
  },
  51: {
    intro: 'Elma bahçeleri ve sarp dağlarıyla bilinen bir yayla kenti.',
    layers: ['snowPeaks', 'trees', 'fields', 'houses'],
    time: 'day',
  },
  40: {
    intro: 'Bozkırın türkülerini ve ozanlarını yetiştirmiş sıcak bir kent.',
    layers: ['plateau', 'fields', 'houses', 'birds'],
    time: 'sunset',
  },
  66: {
    intro: 'Çamlığı ve geniş tarlalarıyla bozkırın ortasında yeşil bir ada.',
    layers: ['plateau', 'pines', 'fields', 'houses'],
    time: 'day',
  },
  70: {
    intro: 'Türkçenin resmî dil ilan edildiği yer olarak anılan, ovaya yayılmış bir şehir.',
    layers: ['plateau', 'castle', 'fields', 'houses'],
    time: 'dawn',
  },
  18: {
    intro: 'Tuz mağaraları ve kuru tepeleriyle bilinen sakin bir kent.',
    layers: ['hills', 'castle', 'houses', 'fields'],
    time: 'day',
  },
  71: {
    intro: 'Nehrin kıvrıldığı vadide kurulmuş, başkente komşu bir şehir.',
    layers: ['river', 'hills', 'city', 'fields'],
    time: 'sunset',
  },
  // Karadeniz
  61: {
    intro: "Sisli yamaçlara tutunan manastırı, yaylaları ve hamsisiyle Karadeniz'in kalbi.",
    layers: ['sea', 'mountains', 'pines', 'clouds', 'houses'],
    time: 'day',
  },
  53: {
    intro: 'Dik yamaçları kaplayan çay bahçeleri ve şelaleli yaylalarıyla yemyeşil bir kıyı.',
    layers: ['terraces', 'mountains', 'waterfall', 'sea', 'clouds'],
    time: 'dawn',
  },
  8: {
    intro: 'Coşkun dereleri, ahşap evleri ve sık ormanlarıyla dağların kenti.',
    layers: ['mountains', 'river', 'pines', 'houses', 'clouds'],
    time: 'day',
  },
  78: {
    intro: 'Ahşap konakları ve dar sokaklarıyla zamanın durduğu bir kasaba.',
    layers: ['hills', 'houses', 'trees', 'clouds'],
    time: 'sunset',
  },
  55: {
    intro: "Geniş deltası ve uzun sahiliyle Karadeniz'in en büyük liman kenti.",
    layers: ['sea', 'river', 'city', 'boats', 'birds'],
    time: 'day',
  },
  5: {
    intro: 'Nehir boyunca dizilen eski evleri ve kayalardaki mezarlarıyla elma kokulu bir şehir.',
    layers: ['river', 'houses', 'rockSpires', 'trees'],
    time: 'night',
  },
  57: {
    intro: 'Ülkenin en kuzey ucunda, mavi ve yeşilin buluştuğu sessiz bir yarımada.',
    layers: ['sea', 'lighthouse', 'pines', 'boats'],
    time: 'sunset',
  },
  37: {
    intro: 'Ahşap camileri ve kanyonlu ormanlarıyla sarp bir dağ kenti.',
    layers: ['mountains', 'pines', 'castle', 'houses'],
    time: 'day',
  },
  14: {
    intro: 'Gölleri ve ormanlarıyla dört mevsim doğa yürüyüşü için bir durak.',
    layers: ['lake', 'pines', 'mountains', 'birds'],
    time: 'dawn',
  },
  28: {
    intro: 'Kiraz ve fındık bahçeleriyle, adası ve kalesiyle anılan bir kıyı kenti.',
    layers: ['sea', 'hills', 'castle', 'trees'],
    time: 'day',
  },
  52: {
    intro: 'Denizi tepeden izleyen teleferiği ve fındıklıklarıyla yeşil bir şehir.',
    layers: ['sea', 'hills', 'trees', 'houses'],
    time: 'sunset',
  },
  74: {
    intro: 'Irmağı, plajları ve eski liman kasabasıyla küçük ama güzel bir kıyı.',
    layers: ['sea', 'river', 'houses', 'boats'],
    time: 'day',
  },
  67: {
    intro: 'Kömür madenleri ve denize bakan yamaçlarıyla emeğin şehri.',
    layers: ['sea', 'hills', 'houses', 'lighthouse'],
    time: 'dawn',
  },
  81: {
    intro: 'Şelaleleri, yaylası ve ormanlarıyla iki büyük şehir arasında yeşil bir mola.',
    layers: ['waterfall', 'pines', 'hills', 'river'],
    time: 'day',
  },
  60: {
    intro: 'Yemenileri, bağları ve kaya mezarlarıyla tarihi bir vadi kenti.',
    layers: ['hills', 'vineyards', 'castle', 'houses'],
    time: 'sunset',
  },
  19: {
    intro: 'Leblebisi ve antik başkent kalıntılarıyla bilinen bir yayla şehri.',
    layers: ['plateau', 'ruins', 'fields', 'houses'],
    time: 'day',
  },
  29: {
    intro: 'Pestili, kömesi ve derin vadileriyle dağların arasında bir şehir.',
    layers: ['mountains', 'river', 'houses', 'pines'],
    time: 'dawn',
  },
  69: {
    intro: 'Yüksek yaylası ve taş kalesiyle küçük, serin bir kent.',
    layers: ['plateau', 'castle', 'river', 'snow'],
    time: 'day',
  },
  // Doğu Anadolu
  25: {
    intro: 'Karlı dağları, kayak pistleri ve çifte minareli yapılarıyla yüksek bir şehir.',
    layers: ['snowPeaks', 'minarets', 'city', 'snow'],
    time: 'day',
  },
  36: {
    intro: 'Taş binaları, kaşarı ve karlı ovalarıyla sınırın ötesine bakan bir kent.',
    layers: ['plateau', 'castle', 'houses', 'snow'],
    time: 'night',
  },
  65: {
    intro: 'Uçsuz göl kıyısında, kahvaltısı ve kedileriyle ünlü bir şehir.',
    layers: ['lake', 'mountains', 'castle', 'birds'],
    time: 'sunset',
  },
  44: {
    intro: 'Kayısı bahçeleri ve dağ başında doğan güneşiyle bilinen bir kent.',
    layers: ['fields', 'trees', 'mountains', 'houses'],
    time: 'dawn',
  },
  23: {
    intro: 'Baraj gölleri ve eski kalesiyle Fırat kıyısında bir şehir.',
    layers: ['lake', 'hills', 'castle', 'houses'],
    time: 'day',
  },
  4: {
    intro: 'Ülkenin en yüksek dağının gölgesinde, geniş bir ova kenti.',
    layers: ['snowPeaks', 'plateau', 'fields', 'clouds'],
    time: 'dawn',
  },
  24: {
    intro: 'Dağlarla çevrili ovası ve coşkun ırmağıyla doğunun kapısı.',
    layers: ['mountains', 'river', 'fields', 'houses'],
    time: 'day',
  },
  13: {
    intro: 'Volkanik krater gölü ve taş evleriyle dağların arasında bir şehir.',
    layers: ['lake', 'mountains', 'houses', 'snow'],
    time: 'sunset',
  },
  62: {
    intro: 'Vadileri, berrak dereleri ve geniş milli parkıyla doğanın korunduğu bir kent.',
    layers: ['river', 'mountains', 'trees', 'birds'],
    time: 'day',
  },
  75: {
    intro: 'Kışın donan gölü ve çiçekli yaylalarıyla en serin duraklardan biri.',
    layers: ['lake', 'plateau', 'snow', 'houses'],
    time: 'dawn',
  },
  76: {
    intro: 'Ovasında kayısı yetişen, karlı dağı gören bir sınır kenti.',
    layers: ['snowPeaks', 'fields', 'trees', 'houses'],
    time: 'sunset',
  },
  49: {
    intro: 'Lalelerin açtığı geniş ovası ve dağlarıyla sakin bir şehir.',
    layers: ['plateau', 'fields', 'mountains', 'houses'],
    time: 'day',
  },
  12: {
    intro: 'Yüzen adacıklı gölü ve ormanlık dağlarıyla serin bir kent.',
    layers: ['lake', 'pines', 'mountains'],
    time: 'dawn',
  },
  30: {
    intro: 'Sarp zirveleri ve derin vadileriyle ülkenin en dağlık köşesi.',
    layers: ['snowPeaks', 'river', 'houses', 'clouds'],
    time: 'day',
  },
  // Güneydoğu Anadolu
  63: {
    intro: 'Balıklı göl çevresindeki taş avlularıyla, tarihin en eski izlerini taşıyan bir şehir.',
    layers: ['lake', 'domes', 'minarets', 'columns', 'birds'],
    time: 'sunset',
  },
  47: {
    intro: 'Ovaya bakan bal rengi taş evleri ve dar sokaklarıyla yamaçta bir şehir.',
    layers: ['hills', 'houses', 'domes', 'plateau'],
    time: 'sunset',
  },
  27: {
    intro: 'Baklavası, bakırcıları ve kalesiyle lezzetin başkenti.',
    layers: ['castle', 'city', 'domes', 'fields'],
    time: 'day',
  },
  21: {
    intro: 'Kara taştan surları ve Dicle kıyısındaki köprüsüyle köklü bir şehir.',
    layers: ['river', 'bridge', 'castle', 'domes'],
    time: 'sunset',
  },
  2: {
    intro: 'Dağ başındaki dev taş başlarıyla güneşin doğuşunu izleten bir kent.',
    layers: ['mountains', 'ruins', 'plateau'],
    time: 'dawn',
  },
  72: {
    intro: "Dicle'nin kıyısında, petrolü ve tarihi köprüsüyle bilinen bir şehir.",
    layers: ['river', 'bridge', 'hills', 'houses'],
    time: 'day',
  },
  56: {
    intro: 'Battaniyeleri, fıstığı ve dağlarla çevrili vadileriyle bir kent.',
    layers: ['mountains', 'river', 'houses', 'trees'],
    time: 'sunset',
  },
  79: {
    intro: 'Zeytinlikleri ve bağlarıyla güneyin küçük, sıcak bir kenti.',
    layers: ['hills', 'trees', 'vineyards', 'houses'],
    time: 'day',
  },
  73: {
    intro: 'Yüksek dağları ve dik vadileriyle sınır boyunda bir şehir.',
    layers: ['mountains', 'river', 'houses'],
    time: 'dawn',
  },
  // Dünya
  82: {
    intro: 'Hazar kıyısında, rüzgârlı sahili ve eski surlu şehriyle kardeş bir başkent.',
    layers: ['sea', 'city', 'tower', 'skyscrapers', 'boats'],
    time: 'night',
  },
  83: {
    intro: 'Dağların çevrelediği vadide, çarşısı ve köprüleriyle sıcak bir şehir.',
    layers: ['mountains', 'river', 'bridge', 'minarets', 'houses'],
    time: 'sunset',
  },
  84: {
    intro: 'Taş köprüsü ve eski çarşısıyla nehrin iki yakasına yayılmış bir başkent.',
    layers: ['river', 'bridge', 'castle', 'houses'],
    time: 'day',
  },
  85: {
    intro: "Beyaz kulesi ve uzun sahil yoluyla Ege'nin öbür kıyısındaki liman kenti.",
    layers: ['sea', 'tower', 'city', 'boats'],
    time: 'sunset',
  },
  86: {
    intro: "Mavi kubbeli meydanlarıyla İpek Yolu'nun parlayan durağı.",
    layers: ['domes', 'minarets', 'desert', 'plateau'],
    time: 'day',
  },
  87: {
    intro: "Tuna'nın iki yakasını köprülerle birleştiren, kaplıcalı bir başkent.",
    layers: ['river', 'bridge', 'castle', 'city'],
    time: 'night',
  },
  88: {
    intro: 'Saraylar, müzik ve kahvehaneleriyle Tuna kıyısında zarif bir şehir.',
    layers: ['city', 'domes', 'tower', 'trees'],
    time: 'sunset',
  },
  89: {
    intro: 'Kanalları, parkları ve büyük bir Türk topluluğuyla canlı bir başkent.',
    layers: ['city', 'tower', 'river', 'trees'],
    time: 'day',
  },
  90: {
    intro: 'Kanalları, bisikletleri ve laleleriyle su üstünde kurulmuş bir şehir.',
    layers: ['river', 'houses', 'windmills', 'fields', 'boats'],
    time: 'day',
  },
  91: {
    intro: 'Saat kulesi, nehri ve kırmızı otobüsleriyle sisli bir başkent.',
    layers: ['river', 'tower', 'bridge', 'city', 'clouds'],
    time: 'dawn',
  },
  92: {
    intro: 'Demir kulesi ve nehir kenarındaki kitapçılarıyla ışıklar şehri.',
    layers: ['river', 'tower', 'city', 'bridge'],
    time: 'night',
  },
  93: {
    intro: 'Antik sütunları, meydanları ve çeşmeleriyle açık hava müzesi gibi bir şehir.',
    layers: ['columns', 'ruins', 'domes', 'city'],
    time: 'sunset',
  },
  94: {
    intro: 'Nil kıyısında, çölün kenarındaki dev piramitlere bakan bir başkent.',
    layers: ['river', 'desert', 'palms', 'minarets', 'city'],
    time: 'sunset',
  },
  95: {
    intro: 'Kırmızı surları, kalabalık meydanı ve çarşılarıyla çölün kapısında bir şehir.',
    layers: ['desert', 'palms', 'minarets', 'houses', 'mountains'],
    time: 'day',
  },
  96: {
    intro: 'Çölden yükselen gökdelenleri ve yapay adalarıyla parıltılı bir şehir.',
    layers: ['desert', 'skyscrapers', 'sea', 'palms'],
    time: 'night',
  },
  97: {
    intro: 'Uzun surları, saray avluları ve geniş meydanlarıyla köklü bir başkent.',
    layers: ['mountains', 'castle', 'city', 'trees'],
    time: 'day',
  },
  98: {
    intro: 'Kiraz çiçekleri, karlı dağı ve ışıl ışıl caddeleriyle hızlı bir şehir.',
    layers: ['snowPeaks', 'skyscrapers', 'tower', 'trees'],
    time: 'night',
  },
  99: {
    intro: 'Dağların okyanusa indiği, sahilleri ve karnavalıyla neşeli bir kent.',
    layers: ['sea', 'mountains', 'city', 'palms', 'birds'],
    time: 'sunset',
  },
  100: {
    intro: 'Gökdelenleri, köprüleri ve özgürlük heykeliyle yolculuğun son büyük durağı.',
    layers: ['sea', 'skyscrapers', 'bridge', 'boats', 'stars'],
    time: 'night',
  },
};
