<script>

    import atlas from '$lib/assets/atlas.json'
    import UlExt from './UlExt.svelte'


    const tocAtlas = atlas.map(([href, descr]) => [ `/${href.replaceAll('-', '/')}`, descr.title ])

    const tocAtlas1859 = tocAtlas.filter(([href]) => /1859/.test(href))
    const tocAtlas1745 = tocAtlas.filter(([href]) => /1745/.test(href))

</script>

На этой сайте собраны лонгриды Михаила Белякова, написанные за последние годы: о русских революциях, альтернативной истории, автобиографические.

Сайт не предназначен для просмотра на мобильных устройствах.

## Альтернативная история

* [Локомотив альтернатив](/locomotiv-alternativ/)
* [Подношение святому Янусу](/podnoshenie-svyatomu-yanusu/)
* [Ирония судьбы и классовой борьбы](/ironiya-sudby-kak-klassovoj-borby/)

## История Российской империи

* [Декабристы и шкурный интерес](/dekabristy-i-shkurnyj-interes/)
* [Доступный канцелярит](/dostupnyj-kancelyarit/)  
* [Простой имперский паренёк](/prostoj-imperskij-parenyok/)  

## Эхо русских революций

* [Спокойной ночи, социализм](/spokojnoj-nochi-socializm/)
* [От японских денег до ноты Риббентропа](/yaponskie-dengi/)
* [Юнона и Турксиб](/yunona-i-turksib/)

## Карты и схемы 

### Атлас Российской империи (1745 г.)

<UlExt toc={tocAtlas1745} />

### Карта земель иррегулярных войск (1859 г.)

<UlExt toc={tocAtlas1859} />

<!--
* [Романовы и турбулентность](/romanovy-i-turbulentnost/)
-->
