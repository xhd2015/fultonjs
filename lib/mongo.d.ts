export class MongoModeller {
    /**
     * @public
     * @param {*} model
     */
    public modelToFilter(model: any): any;
    _replaceFilterOrAnd(filter: any, key: any, conditionList: any): void;
    getRegexList(valueObject: any): {
        $regex: any;
    }[];
}
