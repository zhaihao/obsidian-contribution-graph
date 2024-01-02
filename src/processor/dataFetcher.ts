import { App } from "obsidian";
import { Contribution } from "../types";
import { DataArray, Literal, getAPI } from "obsidian-dataview";
import { GraphProcessError } from "./graphProcessError";
import { DateTime } from "luxon";

export const FILE_CTIME_FIELD = "file.ctime";
export const FILE_MFILE_FIELD = "file.mtime";

export class DataviewDataFetcher {
	fetch(
		query: string,
		dateField?: string,
		dateFieldFormat?: string,
		app?: App
	): Contribution[] {
		if (!query) {
			return [];
		}
		const dv = getAPI(app);
		if (!dv) {
			throw new GraphProcessError({
				summary: "Dataview query not available"
			});
		}
		const data: DataArray<Record<string, Literal>> = dv.pages(query);
		if (dateField) {
			if (dateField == FILE_CTIME_FIELD) {
				return this.groupByFileTime(data, FILE_CTIME_FIELD);
			} else if (dateField == FILE_MFILE_FIELD) {
				return this.groupByFileTime(data, FILE_MFILE_FIELD);
			} else {
				return this.groupByCustomField(data, dateField, dateFieldFormat);
			}
		} else {
			return this.groupByFileTime(data);
		}
	}

	groupByCustomField(
		result: DataArray<Record<string, Literal>>,
		dateFieldName: string,
		dateFieldFormat?: string
	) {
		const convertFailedPages: ConvertFail[] = [];
		const data = result
			.map((page) => {
				return this.toPageWrapper(page, dateFieldName, dateFieldFormat);
			})
			.filter((wrapper) => {
				if (wrapper.date == null) {
					convertFailedPages.push({
						page: wrapper.page.file.name,
						summary:
							"can't find field " + dateFieldName + " in page",
					});
					return false;
				} else {
					return true;
				}
			})
			.groupBy((wrapper) => {
				return wrapper.date?.toFormat("yyyy-MM-dd");
			})
			.map((entry) => {
				return {
					date: entry.key,
					value: entry.rows.length,
				} as Contribution;
			});
		if (convertFailedPages.length > 0) {
			console.warn("this page can't be processed", convertFailedPages);
		}
		return data.array();
	}

	groupByFileTime(data: DataArray<Record<string, Literal>>, type?: string) {
		const groupFunc = (p: Record<string, Literal>) => {
			if (type === FILE_MFILE_FIELD) {
				// @ts-ignore
				return p.file.mtime.toFormat("yyyy-MM-dd");
			} else {
				// @ts-ignore
				return p.file.ctime.toFormat("yyyy-MM-dd");
			}
		};
		return (
			data
				// @ts-ignore
				.groupBy((p) => groupFunc(p))
				.map((entry) => {
					return {
						date: entry.key,
						value: entry.rows.length,
					} as Contribution;
				})
				.array()
		);
	}

	toPageWrapper(
		page: Record<string, Literal>,
		dateFieldName: string,
		dateFieldFormat?: string
	): PageWrapper {
		if (!page[dateFieldName]) {
			return new PageWrapper(
				null,
				page,
				"can't find field " + dateFieldName
			);
		}
		const dateField = page[dateFieldName];
		if (this.isLuxonDateTime(dateField)) {
			// @ts-ignore
			return new PageWrapper(dateField, page);
		} else {
			return new PageWrapper(
				// @ts-ignore
				this.toDateTime(page.file.name, dateField, dateFieldFormat),
				page
			);
		}
	}

	isLuxonDateTime(value: any): boolean {
		if (
			typeof value === "object" &&
			"isLuxonDateTime" in value &&
			value.isLuxonDateTime === true
		) {
			return true;
		}
		return false;
	}

	toDateTime(
		page: string,
		date: string,
		dateFieldFormat?: string
	): DateTime | null {
		if (typeof date !== "string") {
			console.warn(
				"can't parse date, it's a valid format? " +
				date +
				" in page " +
				page
			);
			return null;
		}
		try {
			let dateTime = null;
			if (dateFieldFormat) {
				dateTime = DateTime.fromFormat(date, dateFieldFormat);
				if (dateTime.isValid) {
					return dateTime;
				}
			}

			dateTime = DateTime.fromISO(date);
			if (dateTime.isValid) {
				return dateTime;
			}
			dateTime = DateTime.fromRFC2822(date);
			if (dateTime.isValid) {
				return dateTime;
			}
			dateTime = DateTime.fromHTTP(date);
			if (dateTime.isValid) {
				return dateTime;
			}
			dateTime = DateTime.fromSQL(date);
			if (dateTime.isValid) {
				return dateTime;
			}
			dateTime = DateTime.fromFormat(date, "yyyy-MM-dd HH:mm");
			if (dateTime.isValid) {
				return dateTime;
			}
			dateTime = DateTime.fromFormat(date, "yyyy-MM-ddTHH:mm");
			if (dateTime.isValid) {
				return dateTime;
			}
		} catch (e) {
			console.warn(
				"can't parse date, it's a valid format? " +
				date +
				" in page " +
				page
			);
		}
		return null;
	}
}

export class ConvertFail {
	page: string;
	summary: string;
}

class PageWrapper {
	date: DateTime | null;
	page: any;
	message?: string;

	constructor(date: DateTime | null, page: any, message?: string) {
		this.date = date;
		this.page = page;
		this.message = message;
	}
}
