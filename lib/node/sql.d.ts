export function splitConditions(conds: any): {
    where: any[];
    args: any[];
};
export function splitValues(conds: any): {
    columns: any[];
    placeholders: any[];
    args: any[];
};
