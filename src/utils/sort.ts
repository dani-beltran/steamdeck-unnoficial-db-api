/**
 * Creates a comparator function for sorting objects by a specific field
 * @param field - The field name to compare
 * @param order - Sort order: 'asc' for ascending, 'desc' for descending
 * @returns A comparator function that can be used with Array.sort()
 */
export function createDateComparator<T>(
	field: keyof T,
	order: "asc" | "desc" = "desc",
): (a: T, b: T) => number {
	return (a: T, b: T): number => {
		const aValue = a[field] as Date | null | undefined;
		const bValue = b[field] as Date | null | undefined;

		// Handle null/undefined cases - put them at the end
		if (aValue && bValue) {
			const comparison =
				(bValue as Date).getTime() - (aValue as Date).getTime();
			return order === "desc" ? comparison : -comparison;
		} else if (aValue) {
			return -1; // a comes first (has a value)
		} else if (bValue) {
			return 1; // b comes first (has a value)
		} else {
			return 0; // maintain original order (both null/undefined)
		}
	};
}
