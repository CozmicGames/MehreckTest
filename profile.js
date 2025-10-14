class Profile {
    constructor(id) {
        this.id = id;
        this.resetDataPoints();
        this.isVisible = true;
    }

    get color() {
        return getProfileColor(this.id);
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