function rule() {

    let rule = {
        checks: {},
        min(value){
            this.checks.min =  { value: value };
            return rule;
        },
        max(value){
            this.checks.max =  { value: value };
            return rule;
        },
        regex(regex){
            this.checks.regex = { value: regex};
            return rule;
        },
        parse(value){
            Object.entries(this.checks).forEach(([key, check]) => {
                switch (key) {
                    case 'min':
                        this.checks.min.result = value.length >= check.value;
                        break;
                    case 'max':
                        this.checks.max.result = value.length <= check.value;
                        break
                    case 'regex':
                        this.checks.regex.result = check.value.test(value);
                        break;
                    default:
                        throw new Error("[Zod] Unknown check passed "+check);
                }
            });

            return Object.values(this.checks).every(check => check.result === true);
        }
    };

    return rule;
}