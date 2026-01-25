<script>

    import atlas from '$lib/assets/atlas.json'
    import UlExt from './UlExt.svelte'


    const tocAtlas = atlas.map(([href, descr]) => [ `/${href.replaceAll('-', '/')}`, descr.title ])

    const tocAtlas1859 = tocAtlas.filter(([href]) => /1859/.test(href))
    const tocAtlas1745 = [ ['/atlas-1745/', 'Предисловие к Атласу Российской империи 1745 г.'], ...tocAtlas.filter(([href]) => /1745/.test(href)) ]

</script>

На этой сайте собраны лонгриды Михаила Белякова, написанные за последние годы: о русских революциях, альтернативной истории, автобиографические.

Сайт не предназначен для просмотра на мобильных устройствах.

## Альтернативная история, хронология

* [Локомотив альтернатив](/locomotiv-alternativ/)
* [Подношение святому Янусу](/podnoshenie-svyatomu-yanusu/)
* [1492 год как начало новой эры](/1492-god-kak-nacalo-novoj-ery/)
* [А что это такое бумкнуло?](/a-cto-eto-takoe-bumknulo/)
* [Ирония судьбы и классовой борьбы](/ironiya-sudby-kak-klassovoj-borby/)

## История Российской империи

* [Декабристы и шкурный интерес](/dekabristy-i-shkurnyj-interes/)
* [Доступный канцелярит](/dostupnyj-kancelyarit/)  
* [Простой имперский паренёк](/prostoj-imperskij-parenyok/)  

## Эхо русских революций

* [Спокойной ночи, социализм](/spokojnoj-nochi-socializm/)
* [От японских денег до ноты Риббентропа](/yaponskie-dengi/)
* [Юнона и Турксиб](/yunona-i-turksib/)
* [«Эль Ниньо» над Ярославлем](/yar-myateg/)

## Диаграммы

* [Экспедиция камергера Н. П. Резанова с инспекцией в Русскую Америку](/diagram/rezanovs-voyage)
* [Романовы и турбулентность](/diagram/rovanovy-i-turbulentnost)
* [Российские канцлеры и императоры XVIII в.](/diagram/kanclery-i-imperatory-xviii)
* [Российские канцлеры и императоры XIX в.](/diagram/kanclery-i-imperatory-xix)
* [Российские канцлеры — графы Священной римской империи](/diagram/kanclery-i-grafy)
* [Раевские: служаки и бунтари](/diagram/raevskie-romanovy-golovkiny)
* [«Затейка верховников» (1730 г.)](/diagram/zateyka-verhovnikov)
* [Свержение Брауншвейгского семейства (1741 г.)](/diagram/braunshveigskoe-semeystvo)
* [Заговор Ботта-Лопухиных (1743 г.)](/diagram/zagovor-lopuhinoy)
* [Свержение Петра III (1762 г.)](/diagram/svergenie-petra-iii)
* [Убийство Павла I](/diagram/ubiystvo-pavla-i)

## Карты и схемы 

### Атлас Российской империи (1745 г.)

<UlExt toc={tocAtlas1745} />

### Карта земель иррегулярных войск (1859 г.)

<UlExt toc={tocAtlas1859} />

<!--
* [Романовы и турбулентность](/romanovy-i-turbulentnost/)
-->
