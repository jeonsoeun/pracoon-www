// CLAUD를 이용해서 새로 만들어 보았으나, top과 bottom값이 똑같은 이슈가 있어서 사용하지 않음.
// Supply Demand Zones Implementation in TypeScript
// Based on FluidTrades - SMC Lite indicator

// Type definitions
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
}

export class SupplyDemandAnalyzer {
	private settings: Settings;
	private bars: Bar[] = [];
	private atr: number = 0;
	private currentBarIndex: number = 0; // Track the global bar index

	// Arrays for tracking swing points
	private swingHighValues: number[] = [];
	private swingLowValues: number[] = [];
	private swingHighBarIndexes: number[] = []; // Store actual bar indices, not array positions
	private swingLowBarIndexes: number[] = []; // Store actual bar indices, not array positions

	// Arrays for storing zones
	private supplyZones: Zone[] = [];
	private demandZones: Zone[] = [];
	private bosZones: Zone[] = [];

	// Results that will be exposed
	private swingPatterns: SwingPoint[] = [];

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
	}

	// Process a new bar of data
	public update(bar: Bar): void {
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

	// Find swing highs and lows
	private findSwingPoints(): void {
		const len = this.settings.swingLength;
		const checkBarIndex = this.bars.length - 1 - len;

		if (checkBarIndex < 0) return;

		// Check for swing high
		let isSwingHigh = true;
		for (let i = 1; i <= len; i++) {
			if (checkBarIndex - i < 0 || checkBarIndex + i >= this.bars.length) {
				isSwingHigh = false;
				break;
			}

			if (
				this.bars[checkBarIndex].high <= this.bars[checkBarIndex - i].high ||
				this.bars[checkBarIndex].high <= this.bars[checkBarIndex + i].high
			) {
				isSwingHigh = false;
				break;
			}
		}

		// Check for swing low
		let isSwingLow = true;
		for (let i = 1; i <= len; i++) {
			if (checkBarIndex - i < 0 || checkBarIndex + i >= this.bars.length) {
				isSwingLow = false;
				break;
			}

			if (
				this.bars[checkBarIndex].low >= this.bars[checkBarIndex - i].low ||
				this.bars[checkBarIndex].low >= this.bars[checkBarIndex + i].low
			) {
				isSwingLow = false;
				break;
			}
		}

		// Process swing high
		if (isSwingHigh) {
			const swingHighValue = this.bars[checkBarIndex].high;
			this.addToArray(this.swingHighValues, swingHighValue);

			// Store the actual bar index from the bar object, not the array position
			const actualBarIndex = this.bars[checkBarIndex].index;
			this.addToArray(this.swingHighBarIndexes, actualBarIndex);

			// Determine if it's a Higher High or Lower High
			let pattern: 'HH' | 'LH' | undefined;
			if (this.swingHighValues[0] >= this.swingHighValues[1]) {
				pattern = 'HH';
			} else {
				pattern = 'LH';
			}

			// Add to swing patterns list
			this.swingPatterns.push({
				price: swingHighValue,
				barIndex: actualBarIndex,
				type: 'high',
				pattern
			});

			// Create supply zone
			this.createSupplyZone(swingHighValue, actualBarIndex);
		}

		// Process swing low
		if (isSwingLow) {
			const swingLowValue = this.bars[checkBarIndex].low;
			this.addToArray(this.swingLowValues, swingLowValue);

			// Store the actual bar index from the bar object, not the array position
			const actualBarIndex = this.bars[checkBarIndex].index;
			this.addToArray(this.swingLowBarIndexes, actualBarIndex);

			// Determine if it's a Higher Low or Lower Low
			let pattern: 'HL' | 'LL' | undefined;
			if (this.swingLowValues[0] >= this.swingLowValues[1]) {
				pattern = 'HL';
			} else {
				pattern = 'LL';
			}

			// Add to swing patterns list
			this.swingPatterns.push({
				price: swingLowValue,
				barIndex: actualBarIndex,
				type: 'low',
				pattern
			});

			// Create demand zone
			this.createDemandZone(swingLowValue, actualBarIndex);
		}
	}

	// Add new value to array and remove last (FIFO)
	private addToArray(array: number[], newValue: number): void {
		array.unshift(newValue);
		array.pop();
	}

	// Create a supply zone from a swing high
	private createSupplyZone(swingHigh: number, barIndex: number): void {
		const atrBuffer = this.atr * (this.settings.boxWidth / 10);

		// 수정: top과 bottom 구분을 명확하게 설정
		const top = swingHigh;
		const bottom = swingHigh - atrBuffer;

		const zone: Zone = {
			type: 'supply',
			top: top,
			bottom: bottom,
			left: barIndex, // This is now the actual bar index
			right: this.currentBarIndex, // Use current bar's global index
			poi: (top + bottom) / 2,
			text: 'SUPPLY'
		};

		// Check if zone is overlapping with existing zones
		if (this.checkOverlapping(zone.poi)) {
			// Add zone to supply zones array
			if (this.supplyZones.length >= this.settings.historyToKeep) {
				this.supplyZones.pop(); // Remove oldest
			}
			this.supplyZones.unshift(zone); // Add newest
		}
	}

	// Create a demand zone from a swing low
	private createDemandZone(swingLow: number, barIndex: number): void {
		const atrBuffer = this.atr * (this.settings.boxWidth / 10);

		// 수정: top과 bottom 구분을 명확하게 설정
		const bottom = swingLow;
		const top = swingLow + atrBuffer;

		const zone: Zone = {
			type: 'demand',
			top: top,
			bottom: bottom,
			left: barIndex, // This is now the actual bar index
			right: this.currentBarIndex, // Use current bar's global index
			poi: (top + bottom) / 2,
			text: 'DEMAND'
		};

		// Check if zone is overlapping with existing zones
		if (this.checkOverlapping(zone.poi)) {
			// Add zone to demand zones array
			if (this.demandZones.length >= this.settings.historyToKeep) {
				this.demandZones.pop(); // Remove oldest
			}
			this.demandZones.unshift(zone); // Add newest
		}
	}

	// Check if a POI overlaps with existing zones
	private checkOverlapping(poi: number): boolean {
		const atrThreshold = this.atr * 2;
		let okayToDraw = true;

		// Check against supply zones
		for (const zone of this.supplyZones) {
			const zonePoi = (zone.top + zone.bottom) / 2;
			const upperBoundary = zonePoi + atrThreshold;
			const lowerBoundary = zonePoi - atrThreshold;

			if (poi >= lowerBoundary && poi <= upperBoundary) {
				okayToDraw = false;
				break;
			}
		}

		// Check against demand zones
		if (okayToDraw) {
			for (const zone of this.demandZones) {
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
		const currentClose = this.bars[this.bars.length - 1].close;

		// Check supply zones for breakouts
		for (let i = 0; i < this.supplyZones.length; i++) {
			const levelToBreak = this.supplyZones[i].top;

			if (currentClose >= levelToBreak) {
				// Create BOS zone
				const mid = (this.supplyZones[i].top + this.supplyZones[i].bottom) / 2;
				const bosZone: Zone = {
					type: 'bos',
					top: mid,
					bottom: mid,
					left: this.supplyZones[i].left, // Keep original left
					right: this.currentBarIndex, // Use current bar index
					poi: mid,
					text: 'BOS'
				};

				// Add to BOS zones and remove from supply zones
				this.bosZones.unshift(bosZone);
				this.supplyZones.splice(i, 1);
				i--; // Adjust index since we removed an element

				// Limit BOS zones history
				if (this.bosZones.length > 5) {
					this.bosZones.pop();
				}
			}
		}

		// Check demand zones for breakdowns
		for (let i = 0; i < this.demandZones.length; i++) {
			const levelToBreak = this.demandZones[i].bottom;

			if (currentClose <= levelToBreak) {
				// Create BOS zone
				const mid = (this.demandZones[i].top + this.demandZones[i].bottom) / 2;
				const bosZone: Zone = {
					type: 'bos',
					top: mid,
					bottom: mid,
					left: this.demandZones[i].left, // Keep original left
					right: this.currentBarIndex, // Use current bar index
					poi: mid,
					text: 'BOS'
				};

				// Add to BOS zones and remove from demand zones
				this.bosZones.unshift(bosZone);
				this.demandZones.splice(i, 1);
				i--; // Adjust index since we removed an element

				// Limit BOS zones history
				if (this.bosZones.length > 5) {
					this.bosZones.pop();
				}
			}
		}
	}

	// Extend zones to current bar
	private extendZones(): void {
		// Extend supply zones
		for (const zone of this.supplyZones) {
			zone.right = this.currentBarIndex;
		}

		// Extend demand zones
		for (const zone of this.demandZones) {
			zone.right = this.currentBarIndex;
		}
	}

	// Public getter methods
	public getSupplyZones(): Zone[] {
		return [...this.supplyZones];
	}

	public getDemandZones(): Zone[] {
		return [...this.demandZones];
	}

	public getBOSZones(): Zone[] {
		return [...this.bosZones];
	}

	public getSwingPatterns(): SwingPoint[] {
		return [...this.swingPatterns];
	}
}
