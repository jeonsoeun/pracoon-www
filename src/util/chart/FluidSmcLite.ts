// CLAUD를 이용해서 새로 만들어 보았으나, top과 bottom값이 똑같은 이슈가 있어서 사용하지 않음.
interface Settings {
	swingLength: number;
	historyToKeep: number;
	boxWidth: number;
	showZigZag: boolean;
	showPriceActionLabels: boolean;
}

interface Bar {
	open: number;
	high: number;
	low: number;
	close: number;
	time: number;
	index: number; // Global bar index (matches chart x-position)
}

interface SwingPoint {
	price: number;
	barIndex: number; // Global bar index
	type: 'high' | 'low';
	pattern?: 'HH' | 'LH' | 'HL' | 'LL';
}

interface Zone {
	type: 'supply' | 'demand' | 'bos';
	top: number;
	bottom: number;
	left: number; // Global bar index
	right: number; // Global bar index
	poi: number; // Point of Interest (middle of zone)
	text: string;
	visible: boolean; // 가시성 옵션 추가
}

export class SupplyDemandAnalyzer {
	private settings: Settings;
	private bars: Bar[] = [];
	private atr: number = 0;
	private currentBarIndex: number = 0;

	// Arrays for tracking swing points
	private swingHighValues: number[] = [];
	private swingLowValues: number[] = [];
	private swingHighBarIndexes: number[] = [];
	private swingLowBarIndexes: number[] = [];

	// Arrays for storing zones
	private supplyZones: Zone[] = [];
	private demandZones: Zone[] = [];
	private bosZones: Zone[] = [];

	// Arrays for POI labels
	private supplyPOI: Zone[] = [];
	private demandPOI: Zone[] = [];

	// Results that will be exposed
	private swingPatterns: SwingPoint[] = [];

	// Previous close for crossover detection
	private prevClose: number = 0;

	// Zigzag variables
	private dirUp: boolean = false;
	private lastLow: number = Number.MAX_VALUE;
	private lastHigh: number = 0;
	private timeLow: number = 0;
	private timeHigh: number = 0;

	constructor(settings: Partial<Settings> = {}) {
		// Default settings
		this.settings = {
			swingLength: 10,
			historyToKeep: 20,
			boxWidth: 2.5,
			showZigZag: false,
			showPriceActionLabels: false,
			...settings
		};

		// Initialize empty arrays for historical data
		for (let i = 0; i < 5; i++) {
			this.swingHighValues.push(0);
			this.swingLowValues.push(0);
			this.swingHighBarIndexes.push(0);
			this.swingLowBarIndexes.push(0);
		}

		// Initialize POI arrays
		for (let i = 0; i < this.settings.historyToKeep; i++) {
			this.supplyPOI.push({
				type: 'supply',
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				poi: 0,
				text: 'POI',
				visible: false // 기본적으로 보이지 않음
			});
			this.demandPOI.push({
				type: 'demand',
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				poi: 0,
				text: 'POI',
				visible: false // 기본적으로 보이지 않음
			});
		}

		// Initialize zone arrays
		for (let i = 0; i < this.settings.historyToKeep; i++) {
			this.supplyZones.push({
				type: 'supply',
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				poi: 0,
				text: 'SUPPLY',
				visible: false // 기본적으로 보이지 않음
			});
			this.demandZones.push({
				type: 'demand',
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				poi: 0,
				text: 'DEMAND',
				visible: false // 기본적으로 보이지 않음
			});
		}

		// Initialize BOS zones
		for (let i = 0; i < 5; i++) {
			this.bosZones.push({
				type: 'bos',
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				poi: 0,
				text: 'BOS',
				visible: false // 기본적으로 보이지 않음
			});
		}
	}

	// Process a new bar of data
	public update(bar: Bar): void {
		// Store previous close for crossover detection
		if (this.bars.length > 0) {
			this.prevClose = this.bars[this.bars.length - 1].close;
		} else {
			this.prevClose = bar.open;
		}

		// Update current bar index to use the bar's actual index
		this.currentBarIndex = bar.index;

		this.bars.push(bar);

		// Keep only necessary history
		if (this.bars.length > this.settings.swingLength * 3) {
			this.bars.shift();
		}

		// Calculate ATR if we have enough bars
		if (this.bars.length >= 50) {
			this.atr = this.calculateATR(50);
		}

		// Find swing points if we have enough bars
		if (this.bars.length > this.settings.swingLength * 2) {
			this.findSwingPoints();
			this.updateZigZag();
		}

		// Check for BOS (Break of Structure)
		this.checkForBOS();

		// Extend current boxes to current bar
		this.extendZones();
	}

	// Calculate Average True Range
	private calculateATR(period: number): number {
		if (this.bars.length < period) return 0;

		let sum = 0;
		for (let i = this.bars.length - period; i < this.bars.length; i++) {
			// True Range calculation
			const high = this.bars[i].high;
			const low = this.bars[i].low;
			const prevClose = i > 0 ? this.bars[i - 1].close : this.bars[i].open;

			const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));

			sum += tr;
		}

		return sum / period;
	}

	// Implement pivotHigh similar to Pine Script's ta.pivothigh
	private pivotHigh(length: number): number | null {
		const middleIndex = this.bars.length - 1 - length;
		if (middleIndex < 0 || middleIndex >= this.bars.length) return null;

		const middleHigh = this.bars[middleIndex].high;

		// Check if this is a pivot high
		for (let i = 1; i <= length; i++) {
			if (middleIndex - i < 0 || middleIndex + i >= this.bars.length) return null;

			// If any bar within the window has a higher high, not a pivot high
			if (
				this.bars[middleIndex - i].high >= middleHigh ||
				this.bars[middleIndex + i].high >= middleHigh
			) {
				return null;
			}
		}

		return middleHigh;
	}

	// Implement pivotLow similar to Pine Script's ta.pivotlow
	private pivotLow(length: number): number | null {
		const middleIndex = this.bars.length - 1 - length;
		if (middleIndex < 0 || middleIndex >= this.bars.length) return null;

		const middleLow = this.bars[middleIndex].low;

		// Check if this is a pivot low
		for (let i = 1; i <= length; i++) {
			if (middleIndex - i < 0 || middleIndex + i >= this.bars.length) return null;

			// If any bar within the window has a lower low, not a pivot low
			if (
				this.bars[middleIndex - i].low <= middleLow ||
				this.bars[middleIndex + i].low <= middleLow
			) {
				return null;
			}
		}

		return middleLow;
	}

	// Find swing highs and lows
	private findSwingPoints(): void {
		const len = this.settings.swingLength;
		const swingHigh = this.pivotHigh(len);
		const swingLow = this.pivotLow(len);

		// Process swing high
		if (swingHigh !== null) {
			const actualBarIndex = this.bars[this.bars.length - 1 - len].index;

			// Add to swing high values
			this.addToArray(this.swingHighValues, swingHigh);
			this.addToArray(this.swingHighBarIndexes, actualBarIndex);

			// Determine pattern
			let pattern: 'HH' | 'LH' | undefined;
			if (this.swingHighValues[0] >= this.swingHighValues[1]) {
				pattern = 'HH';
			} else {
				pattern = 'LH';
			}

			// Add to swing patterns
			this.swingPatterns.push({
				price: swingHigh,
				barIndex: actualBarIndex,
				type: 'high',
				pattern
			});

			// Create supply zone
			this.createSupplyZone(swingHigh, actualBarIndex);
		}

		// Process swing low
		if (swingLow !== null) {
			const actualBarIndex = this.bars[this.bars.length - 1 - len].index;

			// Add to swing low values
			this.addToArray(this.swingLowValues, swingLow);
			this.addToArray(this.swingLowBarIndexes, actualBarIndex);

			// Determine pattern
			let pattern: 'HL' | 'LL' | undefined;
			if (this.swingLowValues[0] >= this.swingLowValues[1]) {
				pattern = 'HL';
			} else {
				pattern = 'LL';
			}

			// Add to swing patterns
			this.swingPatterns.push({
				price: swingLow,
				barIndex: actualBarIndex,
				type: 'low',
				pattern
			});

			// Create demand zone
			this.createDemandZone(swingLow, actualBarIndex);
		}
	}

	// Add new value to array and remove last (FIFO)
	private addToArray(array: number[], newValue: number): void {
		array.unshift(newValue);
		if (array.length > 5) {
			array.pop();
		}
	}

	// Create a supply zone from a swing high
	private createSupplyZone(swingHigh: number, barIndex: number): void {
		const atrBuffer = this.atr * (this.settings.boxWidth / 10);

		const top = swingHigh;
		const bottom = swingHigh - atrBuffer;
		const poi = (top + bottom) / 2;

		// Check if zone is overlapping with existing zones
		if (this.checkOverlapping(poi)) {
			// Create new supply zone
			const zone: Zone = {
				type: 'supply',
				top: top,
				bottom: bottom,
				left: barIndex,
				right: this.currentBarIndex + 100, // Extend to future for visualization
				poi: poi,
				text: 'SUPPLY',
				visible: true // 새로 생성하는 존은 보이게 설정
			};

			// Create POI label
			const poiLabel: Zone = {
				type: 'supply',
				top: poi,
				bottom: poi,
				left: barIndex,
				right: this.currentBarIndex + 100,
				poi: poi,
				text: 'POI',
				visible: true // 새로 생성하는 POI 라벨은 보이게 설정
			};

			// Remove oldest and add new
			this.supplyZones.pop();
			this.supplyZones.unshift(zone);

			this.supplyPOI.pop();
			this.supplyPOI.unshift(poiLabel);
		}
	}

	// Create a demand zone from a swing low
	private createDemandZone(swingLow: number, barIndex: number): void {
		const atrBuffer = this.atr * (this.settings.boxWidth / 10);

		const bottom = swingLow;
		const top = swingLow + atrBuffer;
		const poi = (top + bottom) / 2;

		// Check if zone is overlapping with existing zones
		if (this.checkOverlapping(poi)) {
			// Create new demand zone
			const zone: Zone = {
				type: 'demand',
				top: top,
				bottom: bottom,
				left: barIndex,
				right: this.currentBarIndex + 100, // Extend to future for visualization
				poi: poi,
				text: 'DEMAND',
				visible: true // 새로 생성하는 존은 보이게 설정
			};

			// Create POI label
			const poiLabel: Zone = {
				type: 'demand',
				top: poi,
				bottom: poi,
				left: barIndex,
				right: this.currentBarIndex + 100,
				poi: poi,
				text: 'POI',
				visible: true // 새로 생성하는 POI 라벨은 보이게 설정
			};

			// Remove oldest and add new
			this.demandZones.pop();
			this.demandZones.unshift(zone);

			this.demandPOI.pop();
			this.demandPOI.unshift(poiLabel);
		}
	}

	// Check if a POI overlaps with existing zones - FIXED to match Pine Script
	private checkOverlapping(poi: number): boolean {
		const atrThreshold = this.atr * 2;
		let okayToDraw = true;

		// Check against supply zones
		for (const zone of this.supplyZones) {
			if (!zone.visible) continue; // Skip invisible zones

			const zonePoi = (zone.top + zone.bottom) / 2;
			const upperBoundary = zonePoi + atrThreshold;
			const lowerBoundary = zonePoi - atrThreshold;

			if (poi >= lowerBoundary && poi <= upperBoundary) {
				okayToDraw = false;
				break;
			}
		}

		// Check against demand zones if still okay
		if (okayToDraw) {
			for (const zone of this.demandZones) {
				if (!zone.visible) continue; // Skip invisible zones

				const zonePoi = (zone.top + zone.bottom) / 2;
				const upperBoundary = zonePoi + atrThreshold;
				const lowerBoundary = zonePoi - atrThreshold;

				if (poi >= lowerBoundary && poi <= upperBoundary) {
					okayToDraw = false;
					break;
				}
			}
		}

		return okayToDraw;
	}

	// Check for Break of Structure (BOS)
	private checkForBOS(): void {
		if (this.bars.length === 0) return;

		const currentClose = this.bars[this.bars.length - 1].close;

		// Check supply zones for breakouts
		for (let i = 0; i < this.supplyZones.length; i++) {
			if (!this.supplyZones[i].visible) continue; // Skip invisible zones

			const levelToBreak = this.supplyZones[i].top;
			// 실제로 사용할 crossover 변수
			const crossover = this.prevClose < levelToBreak && currentClose >= levelToBreak;

			// 실제 돌파(크로스오버)가 발생했을 때만 BOS 생성
			if (crossover) {
				// Create BOS zone
				const mid = (this.supplyZones[i].top + this.supplyZones[i].bottom) / 2;
				const bosZone: Zone = {
					type: 'bos',
					top: mid,
					bottom: mid,
					left: this.supplyZones[i].left,
					right: this.currentBarIndex,
					poi: mid,
					text: 'BOS',
					visible: true // BOS 존은 보이게 설정
				};

				// Add to BOS zones
				this.bosZones.unshift(bosZone);
				if (this.bosZones.length > 5) {
					this.bosZones.pop();
				}

				// 존을 지우는 대신 보이지 않게 설정
				this.supplyZones[i].visible = false;
				this.supplyPOI[i].visible = false;
			}
		}

		// Check demand zones for breakdowns
		for (let i = 0; i < this.demandZones.length; i++) {
			if (!this.demandZones[i].visible) continue; // Skip invisible zones

			const levelToBreak = this.demandZones[i].bottom;
			// 실제로 사용할 crossunder 변수
			const crossunder = this.prevClose > levelToBreak && currentClose <= levelToBreak;

			// 실제 하향돌파(크로스언더)가 발생했을 때만 BOS 생성
			if (crossunder) {
				// Create BOS zone
				const mid = (this.demandZones[i].top + this.demandZones[i].bottom) / 2;
				const bosZone: Zone = {
					type: 'bos',
					top: mid,
					bottom: mid,
					left: this.demandZones[i].left,
					right: this.currentBarIndex,
					poi: mid,
					text: 'BOS',
					visible: true // BOS 존은 보이게 설정
				};

				// Add to BOS zones
				this.bosZones.unshift(bosZone);
				if (this.bosZones.length > 5) {
					this.bosZones.pop();
				}

				// 존을 지우는 대신 보이지 않게 설정
				this.demandZones[i].visible = false;
				this.demandPOI[i].visible = false;
			}
		}
	}

	// Extend zones to current bar
	private extendZones(): void {
		// Extend supply zones
		for (const zone of this.supplyZones) {
			if (!zone.visible) continue; // Skip invisible zones
			zone.right = this.currentBarIndex + 100; // Extend to future for visualization
		}

		// Extend demand zones
		for (const zone of this.demandZones) {
			if (!zone.visible) continue; // Skip invisible zones
			zone.right = this.currentBarIndex + 100; // Extend to future for visualization
		}

		// Extend POI labels
		for (const poi of this.supplyPOI) {
			if (!poi.visible) continue; // Skip invisible zones
			poi.right = this.currentBarIndex + 100;
		}

		for (const poi of this.demandPOI) {
			if (!poi.visible) continue; // Skip invisible zones
			poi.right = this.currentBarIndex + 100;
		}
	}

	// Implement ZigZag calculation similar to Pine Script
	private updateZigZag(): void {
		if (this.bars.length < this.settings.swingLength * 2 + 1) return;

		const len = this.settings.swingLength;
		const barIndex = this.currentBarIndex;

		// Find highest high and lowest low in the window
		let h = -Infinity;
		let l = Infinity;

		for (let i = 0; i < this.settings.swingLength * 2 + 1 && i < this.bars.length; i++) {
			h = Math.max(h, this.bars[this.bars.length - 1 - i].high);
			l = Math.min(l, this.bars[this.bars.length - 1 - i].low);
		}

		// Check if current bar's high matches the highest
		const isMax =
			this.bars[this.bars.length - 1 - len] && this.bars[this.bars.length - 1 - len].high === h;

		// Check if current bar's low matches the lowest
		const isMin =
			this.bars[this.bars.length - 1 - len] && this.bars[this.bars.length - 1 - len].low === l;

		if (this.dirUp) {
			if (isMin && this.bars[this.bars.length - 1 - len].low < this.lastLow) {
				this.lastLow = this.bars[this.bars.length - 1 - len].low;
				this.timeLow = barIndex - len;
				// Line would be drawn here in Pine Script
			}

			if (isMax && this.bars[this.bars.length - 1 - len].high > this.lastLow) {
				this.lastHigh = this.bars[this.bars.length - 1 - len].high;
				this.timeHigh = barIndex - len;
				this.dirUp = false;
				// Line would be drawn here in Pine Script
			}
		} else {
			if (isMax && this.bars[this.bars.length - 1 - len].high > this.lastHigh) {
				this.lastHigh = this.bars[this.bars.length - 1 - len].high;
				this.timeHigh = barIndex - len;
				// Line would be drawn here in Pine Script
			}

			if (isMin && this.bars[this.bars.length - 1 - len].low < this.lastHigh) {
				this.lastLow = this.bars[this.bars.length - 1 - len].low;
				this.timeLow = barIndex - len;
				this.dirUp = true;
				// Line would be drawn here in Pine Script

				if (isMax && this.bars[this.bars.length - 1 - len].high > this.lastLow) {
					this.lastHigh = this.bars[this.bars.length - 1 - len].high;
					this.timeHigh = barIndex - len;
					this.dirUp = false;
					// Line would be drawn here in Pine Script
				}
			}
		}
	}

	// Public getter methods - 필터링 로직 변경
	public getSupplyZones(): Zone[] {
		return this.supplyZones.filter((zone) => zone.visible);
	}

	public getDemandZones(): Zone[] {
		return this.demandZones.filter((zone) => zone.visible);
	}

	public getBOSZones(): Zone[] {
		return this.bosZones.filter((zone) => zone.visible);
	}

	public getSwingPatterns(): SwingPoint[] {
		return [...this.swingPatterns];
	}

	public getSupplyPOI(): Zone[] {
		return this.supplyPOI.filter((zone) => zone.visible);
	}

	public getDemandPOI(): Zone[] {
		return this.demandPOI.filter((zone) => zone.visible);
	}

	// 존 가시성 관련 메서드 추가
	public toggleZoneVisibility(type: 'supply' | 'demand' | 'bos', index: number): void {
		if (type === 'supply' && index < this.supplyZones.length) {
			this.supplyZones[index].visible = !this.supplyZones[index].visible;
			if (index < this.supplyPOI.length) {
				this.supplyPOI[index].visible = this.supplyZones[index].visible;
			}
		} else if (type === 'demand' && index < this.demandZones.length) {
			this.demandZones[index].visible = !this.demandZones[index].visible;
			if (index < this.demandPOI.length) {
				this.demandPOI[index].visible = this.demandZones[index].visible;
			}
		} else if (type === 'bos' && index < this.bosZones.length) {
			this.bosZones[index].visible = !this.bosZones[index].visible;
		}
	}

	// 모든 존의 가시성 설정
	public setAllZonesVisibility(visible: boolean): void {
		for (const zone of this.supplyZones) {
			if (zone.top !== 0 || zone.bottom !== 0) {
				zone.visible = visible;
			}
		}
		for (const zone of this.demandZones) {
			if (zone.top !== 0 || zone.bottom !== 0) {
				zone.visible = visible;
			}
		}
		for (const zone of this.bosZones) {
			if (zone.top !== 0 || zone.bottom !== 0) {
				zone.visible = visible;
			}
		}
		for (const poi of this.supplyPOI) {
			if (poi.top !== 0 || poi.bottom !== 0) {
				poi.visible = visible;
			}
		}
		for (const poi of this.demandPOI) {
			if (poi.top !== 0 || poi.bottom !== 0) {
				poi.visible = visible;
			}
		}
	}

	// 특정 타입의 모든 존 가시성 설정
	public setZoneTypeVisibility(type: 'supply' | 'demand' | 'bos', visible: boolean): void {
		if (type === 'supply') {
			for (const zone of this.supplyZones) {
				if (zone.top !== 0 || zone.bottom !== 0) {
					zone.visible = visible;
				}
			}
			for (const poi of this.supplyPOI) {
				if (poi.top !== 0 || poi.bottom !== 0) {
					poi.visible = visible;
				}
			}
		} else if (type === 'demand') {
			for (const zone of this.demandZones) {
				if (zone.top !== 0 || zone.bottom !== 0) {
					zone.visible = visible;
				}
			}
			for (const poi of this.demandPOI) {
				if (poi.top !== 0 || poi.bottom !== 0) {
					poi.visible = visible;
				}
			}
		} else if (type === 'bos') {
			for (const zone of this.bosZones) {
				if (zone.top !== 0 || zone.bottom !== 0) {
					zone.visible = visible;
				}
			}
		}
	}
}
