import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "联系我们 - 申冷物流",
  description: "上海申冷国际物流有限公司联系方式，电话、邮箱、地址等。",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <nav className="text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-brand-primary">首页</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-900">联系我们</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            联系我们
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            期待与您的合作，为您提供专业的冷藏集装箱运输服务
          </p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mx-auto max-w-4xl px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Cards */}
          <div className="bg-gradient-to-br from-brand-primary to-brand-deep rounded-3xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-8">上海申冷国际物流有限公司</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">电话</p>
                  <p className="font-semibold text-lg">021-38930219</p>
                  <p className="font-semibold text-lg">021-50673637</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">手机</p>
                  <p className="font-semibold">180 2102 1686（销售总经理）</p>
                  <p className="font-semibold">177 1701 0962</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">邮箱</p>
                  <p className="font-semibold">wangyw@sl-cold.com</p>
                  <p className="font-semibold">wanghh@sl-cold.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">QQ</p>
                  <p className="font-semibold">79412362</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">地址</p>
                  <p className="font-semibold">上海市浦东新区华洲路94号</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">服务范围</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
                  港口冷箱进出口公路运输
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
                  冷箱内装仓储
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
                  冷箱多式联运
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
                  冷链城配与集货
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-brand-primary rounded-full"></span>
                  冷货干线运输
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">服务承诺</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-3xl font-bold text-brand-primary">安全</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-3xl font-bold text-brand-primary">准时</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="text-3xl font-bold text-brand-primary">制冷</p>
                </div>
              </div>
              <p className="text-slate-600 mt-4 text-center">
                准时率 <span className="font-bold text-brand-deep">99%+</span> · 
                成立以来 <span className="font-bold text-brand-deep">0坏箱</span>
              </p>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-200">
              <h3 className="text-xl font-bold text-slate-900 mb-2">工作时间</h3>
              <p className="text-slate-600">
                周一至周六 8:00 - 18:00<br />
                紧急业务 24小时响应
              </p>
            </div>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="mt-12 bg-slate-100 rounded-3xl h-64 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>上海市浦东新区华洲路94号</p>
            <p className="text-sm">外高桥港区附近</p>
          </div>
        </div>
      </div>
    </div>
  );
}
