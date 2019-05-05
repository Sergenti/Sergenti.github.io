function getIndexTable() {
	let returnObj = {};
	const layoutTiles = getLayoutTiles();
	layoutTiles.forEach((tile, i) => returnObj[tile.alt] = i);
	return returnObj;
}

function getLayoutTiles() {
	return [

		/* 0 */
		{ type: 'plain', src: 'img/plain/bare0.png', alt: 'plain_default' },
		{ type: 'camp', src: 'img/map_camp.png', alt: 'camp' },
		{ type: 'city_l', src: 'img/cities/high_density.png', alt: 'city' },
		{ type: 'forest', src: 'img/forest/high_density.png', alt: 'forest' },
		{ type: 'factory', src: 'img/factory/var1.png', alt: 'factory 1' },
		/* 5 */
		{ type: 'water', src: 'img/water/full.png', alt: 'water' },
		{ type: 'city_s', src: 'img/cities/low_density.png', alt: 'village' },
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
		{ type: 'water', src: 'img/water/river_horizontal.png', alt: 'river_horizontal' },
		{ type: 'water', src: 'img/water/top.png', alt: 'water_top' },
		{ type: 'water', src: 'img/water/bottom.png', alt: 'water_bottom' },
		{ type: 'water', src: 'img/water/left.png', alt: 'water_left' },
		{ type: 'water', src: 'img/water/right.png', alt: 'water_right' },
		/* 25 */
		{ type: 'water', src: 'img/water/top_left.png', alt: 'water_top_left' },
		{ type: 'water', src: 'img/water/top_right.png', alt: 'water_top_right' },
		{ type: 'water', src: 'img/water/bottom_left.png', alt: 'water_bottom_left' },
		{ type: 'water', src: 'img/water/bottom_right.png', alt: 'water_bottom_right' },
		{ type: 'water', src: 'img/water/corner_top_left.png', alt: 'water_corner_top_left' },
		/* 30 */
		{ type: 'water', src: 'img/water/corner_top_right.png', alt: 'water_corner_top_right' },
		{ type: 'water', src: 'img/water/corner_bottom_left.png', alt: 'water_corner_bottom_left' },
		{ type: 'water', src: 'img/water/corner_bottom_right.png', alt: 'water_corner_bottom_right' },
		{ type: 'water', src: 'img/water/river_vertical.png', alt: 'river_vertical' },
		{ type: 'highway', src: 'img/highway/bridge_river_vertical.png', alt: 'vertical_highway_bridge' },
		/* 35 */
		{ type: 'water', src: 'img/water/full_rock.png', alt: 'water_rock_1' },
		{ type: 'water', src: 'img/water/river_horizontal_rock.png', alt: 'river_horizontal_rock' },
		{ type: 'water', src: 'img/water/mouth_left.png', alt: 'water_mouth_left' },
		{ type: 'water', src: 'img/water/mouth_right.png', alt: 'water_mouth_right' },
		{ type: 'water', src: 'img/water/top_cbl.png', alt: 'water_top_CBL' },
		/* 40 */
		{ type: 'water', src: 'img/water/top_cbr.png', alt: 'water_top_CBR' },
		{ type: 'water', src: 'img/water/right_ctl.png', alt: 'water_right_CTL' },
		{ type: 'water', src: 'img/water/river_corner_top_right.png', alt: 'river_CTR' },
		{ type: 'water', src: 'img/water/river_corner_bottom_left.png', alt: 'river_CBL' },
		{ type: 'water', src: 'img/water/river_corner_bottom_right.png', alt: 'river_CBR' },
		/* 45 */
		{ type: 'water', src: 'img/water/river_corner_top_right_var1.png', alt: 'river_CTR_var_1' },
		{ type: 'water', src: 'img/water/river_corner_top_left.png', alt: 'river_CTL' },
		{ type: 'water', src: 'img/water/full_rock2.png', alt: 'water rock 2' },
		{ type: 'city_s', src: 'img/cities/small_town_03_64.png', alt: 'small_town_3' },
		{ type: 'city_s', src: 'img/cities/small_town_01.png', alt: 'small_town_1' },
		/* 50 */
		{ type: 'city_s', src: 'img/cities/small_town_02.png', alt: 'small_town_2' },
		{ type: 'city_m', src: 'img/cities/medium_town_01.png', alt: 'medium_town_1' },
		{ type: 'gas_station', src: 'img/highway/horizontal_gas.png', alt: 'horizontal_highway_gas_station' },
		{ type: 'gas_station', src: 'img/highway/vertical_gas.png', alt: 'vertical_highway_gas_station' },
		{ type: 'city_m', src: 'img/cities/medium_town_02.gif', alt: 'medium_town_2' },
		/* 55 */
		{ type: 'city_m', src: 'img/cities/medium_town_03.png', alt: 'medium_town_3' },
		{ type: 'factory', src: 'img/factory/var3.png', alt: 'factory_3' },
		{ type: 'mountain', src: 'img/mountain/mountain_corner_bottom_01.png', alt: 'mountain_corner_bottom_1' }

	];
}