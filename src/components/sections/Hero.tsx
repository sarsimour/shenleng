export default function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="max-w-3xl">
          {/* 主标题 */}
          <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl lg:text-5xl">
            港口冷藏集装箱运输
            <br className="hidden sm:block" />
            专注冷链物流
          </h1>

          {/* 副标题 */}
          <p className="mt-6 text-base leading-relaxed text-gray-600 sm:text-lg">
            申冷物流｜以上海港、宁波港为核心，
            <br className="hidden sm:block" />
            为食品、医药、化工等高价值货物提供
            <strong className="font-medium text-gray-800">
              全程制冷、准时可靠
            </strong>
            的冷链运输服务。
          </p>

          {/* 核心优势 */}
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-700">
            <li>✔ 全自营冷藏车队</li>
            <li>✔ 全程制冷不断链</li>
            <li>✔ 港口冷运经验</li>
            <li>✔ 保险风险兜底</li>
          </ul>

          {/* 行动按钮 */}
          <div className="mt-10 flex gap-4">
            <a
              href="/contact"
              className="inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-light"
            >
              立即联系
            </a>
            <a
              href="tel:021-38930219"
              className="inline-flex items-center rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              电话咨询
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}