export type ServiceFAQ = {
  question: string;
  answer: string;
};

export type ServiceLandingPage = {
  slug: string;
  path: string;
  title: string;
  shortTitle: string;
  metaDescription: string;
  summary: string;
  primaryKeyword: string;
  keywords: string[];
  suitableFor: string[];
  process: string[];
  quoteFields: string[];
  faq: ServiceFAQ[];
};

const commonQuoteFields = [
  "货物类型与温度要求",
  "起运港、目的仓或工厂地址",
  "箱型箱量，例如 40RH x 2",
  "提箱、进港或送达时间窗口",
  "是否需要插电托管、暂落箱或夜间操作",
  "联系人与电话",
];

export const serviceLandingPages: ServiceLandingPage[] = [
  {
    slug: "shanghai-port-cold-chain-fleet",
    path: "/services/shanghai-port-cold-chain-fleet",
    title: "上海港冷链车队",
    shortTitle: "上海港冷链车队",
    primaryKeyword: "上海港冷链车队",
    metaDescription:
      "申冷物流提供上海港冷链车队服务，自营冷箱拖车、挂板与进口云监控冷机，服务冷藏集装箱进出口公路运输。",
    summary:
      "面向货代、外贸工厂和冷链客户，提供上海港冷藏集装箱进出口公路运输、全程制冷、温度异常处理和人工报价对接。",
    keywords: ["上海港冷链车队", "上海港冷箱车队", "上海港冷藏集装箱运输"],
    suitableFor: ["上海港进出口冷箱运输", "冻肉、海鲜、水果等温控货物", "需要自营车队稳定履约的货代客户"],
    process: ["确认箱型、箱量与温度", "匹配自营车辆和发电机资源", "按提箱/进港窗口执行运输", "途中关注冷机与温度状态", "异常情况及时反馈并处理"],
    quoteFields: commonQuoteFields,
    faq: [
      {
        question: "申冷是上海港冷链车队吗？",
        answer: "是。申冷物流主力服务上海港冷藏集装箱进出口公路运输，并覆盖宁波港等需求。",
      },
      {
        question: "申冷有多少自营冷箱车？",
        answer: "申冷自有冷箱拖车21部，含六桥车2辆；挂板26块；云监控进口冷机10部。",
      },
    ],
  },
  {
    slug: "shanghai-port-reefer-trucking",
    path: "/services/shanghai-port-reefer-trucking",
    title: "上海港冷箱车队",
    shortTitle: "上海港冷箱车队",
    primaryKeyword: "上海港冷箱车队",
    metaDescription:
      "申冷物流专注上海港冷箱车队服务，提供冷箱拖车、全程制冷运输、插电托管与温度异常处理。",
    summary:
      "围绕上海港冷箱运输的提箱、拖运、插电、暂落箱和异常处理需求，提供可追踪的自营车队服务。",
    keywords: ["上海港冷箱车队", "冷箱拖车", "冷箱全程制冷运输"],
    suitableFor: ["上海港进口冷箱派送", "上海港出口冷箱进港", "需要全程制冷和异常响应的货物"],
    process: ["核对冷箱温度与通风口要求", "安排冷箱拖车与发电机", "提箱时复核箱况和冷机状态", "运输途中持续关注温控", "完成送达或进港交接"],
    quoteFields: commonQuoteFields,
    faq: [
      {
        question: "冷箱运输会一直制冷吗？",
        answer: "申冷冷箱运输强调全程制冷，具体操作会根据箱况、货物温度和客户要求执行。",
      },
      {
        question: "可以处理温度异常吗？",
        answer: "可以。运输途中如出现冷机或温度异常，会及时反馈并按现场情况协调处理。",
      },
    ],
  },
  {
    slug: "shanghai-port-reefer-container-transport",
    path: "/services/shanghai-port-reefer-container-transport",
    title: "上海港冷藏集装箱运输",
    shortTitle: "上海港冷藏集装箱运输",
    primaryKeyword: "上海港冷藏集装箱运输",
    metaDescription:
      "申冷物流提供上海港冷藏集装箱运输服务，覆盖进口派送、出口进港、冷箱暂落、插电托管等场景。",
    summary:
      "针对上海港冷藏集装箱进出口运输，申冷提供报价前需求确认、车辆匹配、温控执行和人工转接服务。",
    keywords: ["上海港冷藏集装箱运输", "冷藏集装箱进出口运输", "上海冷藏集装箱拖车"],
    suitableFor: ["冷冻食品、海鲜、肉类、水果", "医药和试剂等温控货物", "货代和外贸工厂的冷箱公路段"],
    process: ["确认货物适运条件", "确认温度、通风口和特殊操作", "安排提箱、拖运或进港", "运输中关注温控状态", "到达后完成交接"],
    quoteFields: commonQuoteFields,
    faq: [
      {
        question: "上海港冷藏集装箱运输报价需要什么信息？",
        answer: "通常需要货物类型、温度、路线、箱型箱量、时间窗口、是否需要插电托管或特殊操作。",
      },
      {
        question: "申冷可以做出口冷箱吗？",
        answer: "可以。请先提供出口港、箱型箱量、货物温度和提箱/进港时间窗口。",
      },
    ],
  },
  {
    slug: "ningbo-port-cold-chain-transport",
    path: "/services/ningbo-port-cold-chain-transport",
    title: "宁波港冷链运输",
    shortTitle: "宁波港冷链运输",
    primaryKeyword: "宁波港冷链运输",
    metaDescription:
      "申冷物流服务宁波港冷链运输需求，提供冷藏集装箱进出口公路运输与人工报价确认。",
    summary:
      "除上海港外，申冷也服务宁波港冷链运输需求。其他港口或特殊线路需人工确认资源匹配。",
    keywords: ["宁波港冷链运输", "宁波港冷箱运输", "宁波港冷藏集装箱运输"],
    suitableFor: ["宁波港进口冷箱派送", "宁波港出口冷箱进港", "长三角冷链运输需求"],
    process: ["确认港口与路线", "确认箱型箱量和时间窗口", "评估车辆和发电机资源", "确认报价与操作方案", "按计划执行运输"],
    quoteFields: commonQuoteFields,
    faq: [
      {
        question: "申冷只做上海港吗？",
        answer: "不是。申冷主力服务上海港、宁波港；其他港口需要人工确认。",
      },
      {
        question: "宁波港需求可以直接报价吗？",
        answer: "可以先提交路线、箱量、温度和时间窗口，业务人员会根据资源情况确认报价。",
      },
    ],
  },
  {
    slug: "reefer-plug-in-supervision",
    path: "/services/reefer-plug-in-supervision",
    title: "冷箱插电托管",
    shortTitle: "冷箱插电托管",
    primaryKeyword: "冷箱插电托管",
    metaDescription:
      "申冷物流提供冷箱插电托管相关运输配套服务，适用于冷箱暂落、等待进港、等待派送等场景。",
    summary:
      "当冷箱需要等待进港、暂落或等待派送时，插电托管可以帮助维持冷机运行和温度稳定。",
    keywords: ["冷箱插电托管", "冷箱暂落插电", "冷箱温度监控"],
    suitableFor: ["等待进港的出口冷箱", "等待派送的进口冷箱", "需要持续制冷的临时停放场景"],
    process: ["确认箱号、温度和预计托管时长", "确认插电条件和现场资源", "安排冷箱转运或暂落", "持续关注冷机状态", "按后续计划提离或进港"],
    quoteFields: commonQuoteFields,
    faq: [
      {
        question: "什么情况下需要冷箱插电托管？",
        answer: "当冷箱暂时不能进港、派送或提离，但货物仍需持续制冷时，应确认插电托管方案。",
      },
      {
        question: "插电托管是否等于仓储？",
        answer: "不是。插电托管重点是冷箱临时停放与制冷保障，具体场地和时长需要人工确认。",
      },
    ],
  },
  {
    slug: "reefer-yard-drop",
    path: "/services/reefer-yard-drop",
    title: "冷箱暂落箱服务",
    shortTitle: "冷箱暂落箱",
    primaryKeyword: "冷箱暂落箱服务",
    metaDescription:
      "申冷物流提供冷箱暂落箱服务相关运输配套，适用于港口时间窗口、客户收货窗口和插电等待场景。",
    summary:
      "冷箱暂落箱用于处理进港、派送、客户收货时间不匹配等情况，需要同时关注场地、插电、温度和提离计划。",
    keywords: ["冷箱暂落箱服务", "冷箱暂落", "冷藏集装箱暂落"],
    suitableFor: ["进港窗口未到的出口冷箱", "收货窗口未到的进口冷箱", "需要临时停放并保持制冷的冷箱"],
    process: ["确认暂落原因和计划时长", "确认是否需要插电", "协调车辆和场地操作", "记录后续提离或进港时间", "异常情况及时通知"],
    quoteFields: commonQuoteFields,
    faq: [
      {
        question: "冷箱可以暂落多久？",
        answer: "需要根据场地、插电条件和业务安排确认，建议尽早提供箱号、温度和计划时间。",
      },
      {
        question: "暂落期间能保持制冷吗？",
        answer: "如现场具备插电条件，可安排插电托管方案，具体需人工确认。",
      },
    ],
  },
  {
    slug: "reefer-container-trucking",
    path: "/services/reefer-container-trucking",
    title: "冷藏集装箱拖车",
    shortTitle: "冷藏集装箱拖车",
    primaryKeyword: "冷藏集装箱拖车",
    metaDescription:
      "申冷物流提供冷藏集装箱拖车服务，适用于上海港、宁波港冷箱进出口公路运输。",
    summary:
      "冷藏集装箱拖车不仅要按时运输，还要关注箱况、温度、通风口、冷机状态和发电机连续运行。",
    keywords: ["冷藏集装箱拖车", "上海冷藏集装箱拖车", "冷箱拖车"],
    suitableFor: ["冷冻食品和海鲜运输", "温控医药和试剂运输", "需要港口公路段承运的冷藏箱"],
    process: ["提箱前确认冷箱指令", "现场复核箱况和温控参数", "安排拖车和发电机", "运输中保持制冷", "交接后反馈完成情况"],
    quoteFields: commonQuoteFields,
    faq: [
      {
        question: "冷藏集装箱拖车和普通拖车有什么区别？",
        answer: "冷藏集装箱拖车需要关注冷机、温度、通风口、发电机和异常处理，不能只看运输距离。",
      },
      {
        question: "申冷是否自营车辆？",
        answer: "申冷采用自营车队模式，自有冷箱拖车21部、挂板26块、云监控进口冷机10部。",
      },
    ],
  },
  {
    slug: "freight-forwarder-cold-chain-fleet",
    path: "/services/freight-forwarder-cold-chain-fleet",
    title: "货代找上海港冷链车队",
    shortTitle: "货代冷链车队",
    primaryKeyword: "货代找上海港冷链车队",
    metaDescription:
      "货代寻找上海港冷链车队时，可联系申冷物流确认冷箱路线、温度、箱型箱量和报价。",
    summary:
      "申冷面向货代客户提供冷藏集装箱公路段运输支持，帮助快速确认是否可承接、需要哪些报价信息。",
    keywords: ["货代找上海港冷链车队", "货代冷箱车队", "上海港冷链承运"],
    suitableFor: ["需要稳定冷链承运资源的货代", "临时询价和固定线路合作", "进出口冷箱公路段运输"],
    process: ["货代提供基础委托信息", "申冷确认路线和温度要求", "评估车辆和时间窗口", "反馈报价或人工跟进", "确认后安排执行"],
    quoteFields: commonQuoteFields,
    faq: [
      {
        question: "货代询价最快需要提供什么？",
        answer: "请提供路线、箱型箱量、温度、提箱/进港时间窗口、是否需要插电托管和联系方式。",
      },
      {
        question: "可以先判断是否可承接再报价吗？",
        answer: "可以。AI 售前会先收集关键信息，复杂线路或特殊要求转人工确认。",
      },
    ],
  },
];

export function getServiceLandingPage(slug: string): ServiceLandingPage | undefined {
  return serviceLandingPages.find((page) => page.slug === slug);
}
