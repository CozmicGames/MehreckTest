class Profile {
    constructor(id) {
        this._id = id;
        this.resetDataPoints();
        this._isVisible = true;
    }

    get id() {
        return this._id;
    }

    get color() {
        return getProfileColor(this._id);
    }

    get isVisible() {
        return this._isVisible;
    }

    set isVisible(value) {
        this._isVisible = value;
    }

    resetDataPoints() {
        this.dataPoints = [];
        this.dataPointsValid = [];
    }

    getDataPoint(index) {
        return this.dataPoints[index];
    }

    setDataPoint(index, value) {
        this.dataPoints[index] = value;
        this.dataPointsValid[index] = true;
    }

    isDataPointValid(index) {
        return this.dataPointsValid[index];
    }
}