class StatisticsService {
    static getGPAStatus(students) {
        const gpas = students.map(s => s.gpa)
        return {
            average: this.calculateAverage(gpas),
            min: Math.min(...gpas),
            max: Math.max(...gpas),
            total: students.length
        };
    }

    static getAgeStats(students) {
        const ages = students.map(s => s.age);
        return {
            average: this.calculateAverage(ages),
            min: Math.min(...ages),
            max: Math.max(...ages) 
        };
    }
    static getMajorDistribution(students) {
        const distribution = {};
        students.forEach(student => {
            distribution[student.major] = (distribution[student.major] || 0) + 1;
        });
        return distribution;
    }
    static calculateAverage(numbers){
        return numbers.reduce((sum,num) => sum + num, 0) / numbers.length
    }
    static getTopStudents(students,count = 5 ){
        return [... students].sort((a,b) => b.gpa - a.gpa).slice(0,count);
    }
}