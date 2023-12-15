export interface ContributionGraphConfig {
	title: string;
	days: number | undefined;
	fromDate: Date | string | undefined;
	toDate: Date | string | undefined;
	data: Contribution[];
	cellStyleRules: CellStyleRule[];
	startOfWeek: number; // 0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday, 5: Friday, 6: Saturday
	onCellClick: (
		cellData: ContributionCellData,
		event: MouseEvent | undefined
	) => void | undefined;
}

export interface Contribution {
	date: string;
	value: number;
	summary: string | undefined;
}

export interface CellStyleRule {
	// the background color for the cell
	color: string;
	// the text in the cell
	text: string | undefined;
	// the inlusive min value 
	min: number;
	// the exclusive max value   
	max: number;
}

export class ContributionCellData {
	date: string; // yyyy-MM-dd
	weekDay: number; // 0 - 6
	month: number; // 0 - 11
	monthDate: number; // 1 - 31
	year: number; // sample: 2020
	value: number;
	summary?: string;
}
