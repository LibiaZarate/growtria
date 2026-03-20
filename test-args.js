function test() { console.log(arguments.length); }
test(1, 2, undefined);
test(1, 2, JSON.stringify(undefined));
test(1, 2, JSON.stringify(undefined), JSON.stringify(undefined));
