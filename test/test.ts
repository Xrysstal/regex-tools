﻿/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
/// <reference path="../typings/lang.d.ts" />

require('source-map-support').install();

import { expect, assert } from 'chai';

import RegexTools = require('../bld/index');

interface CombineTestCase {
    regexs: RegexTools.NestedRegexs,
    expect: RegExp;
}

var caseCategoryMap: Dictionary<Dictionary<CombineTestCase[]>> = {
    "(?:...) wrapping": {
        "should not wrap root |": [
            {
                regexs: {
                    regexs: [
                        /abc/,
                        /def/
                    ],
                    or: true
                },
                expect: /abc|def/
            }
        ],
        "should wrap combined regex that has | if its upper has no |": [
            {
                regexs: [
                    /biu/,
                    {
                        regexs: [
                            /abc/,
                            /def/
                        ],
                        or: true
                    },
                    /pia/
                ],
                expect: /biu(?:abc|def)pia/
            }
        ],
        "should not wrap combined regex that has | if its upper has |": [
            {
                regexs: {
                    regexs: [
                        /biu/,
                        {
                            regexs: [
                                /abc/,
                                /def/
                            ],
                            or: true
                        },
                        /pia/
                    ],
                    or: true
                },
                expect: /biu|abc|def|pia/
            }
        ],
        "should not wrap combined regex that has | if it's already been wrapped": [
            {
                regexs: [
                    /biu/,
                    {
                        regexs: [
                            /abc/,
                            /def/
                        ],
                        or: true,
                        capture: true
                    },
                    /pia/
                ],
                expect: /biu(abc|def)pia/
            },
            {
                regexs: [
                    /biu/,
                    {
                        regexs: [
                            /(abc|def)/
                        ],
                        or: true
                    },
                    /pia/
                ],
                expect: /biu(abc|def)pia/
            }
        ],
        "should wrap or not wrap combined regex that has | based on conditions": [
            {
                regexs: [
                    /biu/,
                    {
                        regexs: [
                            /abc/,
                            /def/,
                            {
                                regexs: [
                                    /ghi/,
                                    /jkl/
                                ],
                                or: true
                            }
                        ],
                        or: true
                    },
                    /pia/
                ],
                expect: /biu(?:abc|def|ghi|jkl)pia/
            }
        ],
        "should wrap single regex that has root | and its upper has no |": [
            {
                regexs: [
                    /biu/,
                    /abc|def/,
                    /pia/
                ],
                expect: /biu(?:abc|def)pia/
            }
        ],
        "should not wrap single regex that has root | but its upper has no |": [
            {
                regexs: [
                    /biu/,
                    /abc|def/,
                    /pia/
                ],
                expect: /biu(?:abc|def)pia/
            }
        ],
        "should wrap regex that has repeat pattern": [
            {
                regexs: {
                    regexs: [
                        /biu/,
                        /pia/
                    ],
                    repeat: '+'
                },
                expect: /(?:biupia)+/
            }
        ]
    },
    "group capturing": {
        "should capture group that has name option": [
            {
                regexs: {
                    name: 'abc',
                    regexs: [
                        /abc/,
                        /def/,
                        {
                            regexs: [
                                /ghi/,
                                /jkl/
                            ],
                            or: true
                        }
                    ]
                },
                expect: /(abcdef(?:ghi|jkl))/
            },
            {
                regexs: [
                    {
                        name: 'abc',
                        regexs: /def/
                    }
                ],
                expect: /(def)/
            }
        ],
        "should capture group that has capture option true": [
            {
                regexs: {
                    regexs: [
                        /abc/,
                        /def/,
                        {
                            regexs: [
                                /ghi/,
                                /jkl/
                            ],
                            or: true
                        }
                    ],
                    capture: true
                },
                expect: /(abcdef(?:ghi|jkl))/
            },
            {
                regexs: [
                    {
                        regexs: /def/,
                        capture: true
                    }
                ],
                expect: /(def)/
            }
        ]
    },
    "group matching": {
        "should increase back reference number if it has other groups captured before": [
            {
                regexs: [
                    /a($name:b)c(def)/,
                    /([abc])\1/
                ],
                expect: /a(b)c(def)([abc])\3/
            }
        ],
        "should handle back reference by named group properly": [
            {
                regexs: [
                    /a($name:b)c(def)/,
                    /([abc])($name)/
                ],
                expect: /a(b)c(def)([abc])\1/
            },
            {
                regexs: [
                    /a($name:b)c(def)/,
                    {
                        regexs: [
                            /xxx/,
                            /yyy/,
                            [
                                /zzz/,
                                /vvv($name)/
                            ]
                        ],
                        or: true
                    }
                ],
                expect: /a(b)c(def)(?:xxx|yyy|zzzvvv\1)/
            }
        ],
        "should handle back reference number that's greater than 9": [
            {
                regexs: [
                    /()()/,
                    /()()()()()()()()()()(...)\11/,
                ],
                expect: /()()()()()()()()()()()()(...)\13/
            },
            {
                regexs: [
                    /()()()()()()()()()()($name:...)/,
                    {
                        regexs: [
                            /abc/,
                            /($name)/
                        ],
                        or: true
                    }
                ],
                expect: /()()()()()()()()()()(...)(?:abc|\11)/
            },
            {
                regexs: [
                    /()()()()()()()()()()($name:...)/,
                    {
                        regexs: [
                            /abc/,
                            /($name)123/
                        ],
                        or: true
                    }
                ],
                expect: /()()()()()()()()()()(...)(?:abc|(?:\11)123)/
            }
        ]
    }
};

Object
    .keys(caseCategoryMap)
    .forEach(caseCategoryName => {
        describe(caseCategoryName, () => {
            var caseCategory = caseCategoryMap[caseCategoryName];
            Object
                .keys(caseCategoryMap[caseCategoryName])
                .forEach(caseName => {
                    it(caseName, () => {
                        var testCases = caseCategory[caseName];
                        testCases.forEach(testCase => {
                            var result = RegexTools.combine(testCase.regexs);
                            expect(result.combined).to.equal(testCase.expect.source);
                        });
                    });
                });
        });
    });