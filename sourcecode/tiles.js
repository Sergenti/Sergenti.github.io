function getIndexTable() {
    return {//references to the typeIndex of each different tile

        plain: 0,
        camp: 1,
        city: 2,
        forest_high: 3,
        factory: 4,
        water: 5,
        town: 6,
        highway_horizontal: 7,
        highway_vertical: 8,
        highway_top_left: 9,
        highway_top_right: 10,
        highway_bottom_left: 11,
        highway_bottom_right: 12,
        plain_bare1: 13,
        plain_bare2: 14,
        plain_tree1: 15,
        plain_tree2: 16,
        plain_tree3: 17,
        factory2: 18,
        plain_bare3: 19,
        river_horizontal: 20,
        water_top: 21,
        water_bottom: 22,
        water_left: 23,
        water_right: 24,
        water_top_left: 25,
        water_top_right: 26,
        water_bottom_left: 27,
        water_bottom_right: 28,
        water_corner_top_left: 29,
        water_corner_top_right: 30,
        water_corner_bottom_left: 31,
        water_corner_bottom_right: 32,
        river_vertical: 33,
        highway_bridge_river_vertical: 34,
        small_town_01: 35,
        small_town_02: 36,
        small_town_03: 37,
        medium_town_01: 38,
        medium_town_02: 39,
        medium_town_03: 40,
        Factory3: 41,

    };
}

function getLayoutTiles() {
    return [

        /* 0 */
        { type: 'plain', src: 'img/plain/bare0.png', alt: 'plain default' },
        { type: 'camp', src: 'img/map_camp.png', alt: 'map_camp' },
        { type: 'city_l', src: 'img/cities/high_density.png', alt: 'map_city' },
        { type: 'forest', src: 'img/forest/high_density.png', alt: 'map_forest' },
        { type: 'factory', src: 'img/factory/var1.png', alt: 'factory 1' },
        /* 5 */
        { type: 'water', src: 'img/water/full.png', alt: 'map_water' },
        { type: 'city_s', src: 'img/cities/low_density.png', alt: 'map_town' },
        { type: 'highway', src: 'img/highway/horizontal.png', alt: 'highway_horizontal' },
        { type: 'highway', src: 'img/highway/vertical.png', alt: 'highway_vertical' },
        { type: 'highway', src: 'img/highway/top_left.png', alt: 'highway_top_left' },
        /* 10 */
        { type: 'highway', src: 'img/highway/top_right.png', alt: 'highway_top_right' },
        { type: 'highway', src: 'img/highway/bottom_left.png', alt: 'highway_bottom_left' },
        { type: 'highway', src: 'img/highway/bottom_right.png', alt: 'highway_bottom_right' },
        { type: 'plain', src: 'img/plain/bare1.png', alt: 'bare1' },
        { type: 'plain', src: 'img/plain/bare2.png', alt: 'bare2' },
        /* 15 */
        { type: 'plain', src: 'img/plain/tree1.png', alt: 'tree1' },
        { type: 'plain', src: 'img/plain/tree2.png', alt: 'tree2' },
        { type: 'plain', src: 'img/plain/tree3.png', alt: 'tree3' },
        { type: 'factory', src: 'img/factory/var2.png', alt: 'factory 2' },
        { type: 'plain', src: 'img/plain/bare3.png', alt: 'bare3' },
        /* 20 */
        { type: 'water', src: 'img/water/river_horizontal.png', alt: 'river horizontal' },
        { type: 'water', src: 'img/water/top.png', alt: 'water top' },
        { type: 'water', src: 'img/water/bottom.png', alt: 'water bottom' },
        { type: 'water', src: 'img/water/left.png', alt: 'water left' },
        { type: 'water', src: 'img/water/right.png', alt: 'water right' },
        /* 25 */
        { type: 'water', src: 'img/water/top_left.png', alt: 'water top left' },
        { type: 'water', src: 'img/water/top_right.png', alt: 'water top right' },
        { type: 'water', src: 'img/water/bottom_left.png', alt: 'water bottom left' },
        { type: 'water', src: 'img/water/bottom_right.png', alt: 'water bottom right' },
        { type: 'water', src: 'img/water/corner_top_left.png', alt: 'water corner top left' },
        /* 30 */
        { type: 'water', src: 'img/water/corner_top_right.png', alt: 'water corner top right' },
        { type: 'water', src: 'img/water/corner_bottom_left.png', alt: 'water corner bottom left' },
        { type: 'water', src: 'img/water/corner_bottom_right.png', alt: 'water corner bottom right' },
        { type: 'water', src: 'img/water/river_vertical.png', alt: 'river vertical' },
        { type: 'highway', src: 'img/highway/bridge_river_vertical.png', alt: 'vertical highway bridge' },
        /* 35 */
        { type: 'water', src: 'img/water/full_rock.png', alt: 'water rock 1' },
        { type: 'water', src: 'img/water/river_horizontal_rock.png', alt: 'river horizontal rock' },
        { type: 'water', src: 'img/water/mouth_left.png', alt: 'water mouth left' },
        { type: 'water', src: 'img/water/mouth_right.png', alt: 'water mouth right' },
        { type: 'water', src: 'img/water/top_cbl.png', alt: 'water top CBL' },
        /* 40 */
        { type: 'water', src: 'img/water/top_cbr.png', alt: 'water top CBR' },
        { type: 'water', src: 'img/water/right_ctl.png', alt: 'water right CTL' },
        { type: 'water', src: 'img/water/river_corner_top_right.png', alt: 'river CTR' },
        { type: 'water', src: 'img/water/river_corner_bottom_left.png', alt: 'river CBL' },
        { type: 'water', src: 'img/water/river_corner_bottom_right.png', alt: 'river CBR' },
        /* 45 */
        { type: 'water', src: 'img/water/river_corner_top_right_var1.png', alt: 'river CTR var 1' },
        { type: 'water', src: 'img/water/river_corner_top_left.png', alt: 'river CTL' },
        { type: 'water', src: 'img/water/full_rock2.png', alt: 'water rock 2' },
        { type: 'city_s', src: 'img/cities/small_town_03_64.png', alt: 'small town 3' },
        { type: 'city_s', src: 'img/cities/small_town_01.png', alt: 'small town 1' },
        /* 50 */
        { type: 'city_s', src: 'img/cities/small_town_02.png', alt: 'small town 2' },
        { type: 'city_m', src: 'img/cities/medium_town_01.png', alt: 'medium town 1' },
        { type: 'gas_station', src: 'img/highway/horizontal_gas.png', alt: 'horiz. highway gas station' },
        { type: 'gas_station', src: 'img/highway/vertical_gas.png', alt: 'vert. highway gas station' },
        { type: 'city_m', src: 'img/cities/medium_town_02.gif', alt: 'medium town 2' },
        /* 55 */
        { type: 'city_m', src: 'img/cities/medium_town_03.png', alt: 'medium town 3' },
        { type: 'factory', src: 'img/factory/var3.png', alt: 'factory 3' },
        { type:'mountain', src: 'img/mountain/mountain_corner_bottom_01.png', alt: 'mountain corner bottom 1'}

    ];
}