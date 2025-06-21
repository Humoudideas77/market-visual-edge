
import React from 'react';
import { Shield, Eye, Server, CheckCircle } from 'lucide-react';

const SecuritySection = () => {
  return (
    <section className="py-20 bg-exchange-panel">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-exchange-text-primary mb-4">
                Enterprise-Grade Security
              </h2>
              <p className="text-xl text-exchange-text-secondary">
                Your assets are protected by military-grade security measures and industry-leading 
                compliance standards trusted by millions of users worldwide.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-exchange-green/20 rounded-lg flex items-center justify-center mt-1">
                  <Shield className="w-6 h-6 text-exchange-green" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-exchange-text-primary mb-2">Cold Storage Protection</h3>
                  <p className="text-exchange-text-secondary">95% of user funds are stored in offline cold wallets, protected from online threats and cyber attacks.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-exchange-blue/20 rounded-lg flex items-center justify-center mt-1">
                  <Eye className="w-6 h-6 text-exchange-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-exchange-text-primary mb-2">24/7 Monitoring</h3>
                  <p className="text-exchange-text-secondary">Advanced fraud detection and real-time monitoring systems protect against suspicious activities.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-exchange-red/20 rounded-lg flex items-center justify-center mt-1">
                  <Server className="w-6 h-6 text-exchange-red" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-exchange-text-primary mb-2">Infrastructure Security</h3>
                  <p className="text-exchange-text-secondary">SOC 2 certified infrastructure with multi-layer firewalls and DDoS protection.</p>
                </div>
              </div>
            </div>

            <div className="bg-exchange-accent rounded-xl p-6 border border-exchange-border">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-exchange-green" />
                <h4 className="text-lg font-semibold text-exchange-text-primary">Security Certifications</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-exchange-green rounded-full"></div>
                  <span className="text-exchange-text-secondary">ISO 27001 Certified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-exchange-green rounded-full"></div>
                  <span className="text-exchange-text-secondary">SOC 2 Type II</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-exchange-green rounded-full"></div>
                  <span className="text-exchange-text-secondary">PCI DSS Level 1</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-exchange-green rounded-full"></div>
                  <span className="text-exchange-text-secondary">CCSS Compliant</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-exchange-bg rounded-2xl p-8 border border-exchange-border">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-exchange-blue to-exchange-green rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-exchange-text-primary mb-2">$2.1B+</h3>
                  <p className="text-exchange-text-secondary">Assets Under Protection</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-exchange-accent rounded-lg">
                    <span className="text-exchange-text-primary">Security Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-exchange-border rounded-full">
                        <div className="w-[95%] h-2 bg-exchange-green rounded-full"></div>
                      </div>
                      <span className="text-exchange-green font-semibold">95%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-exchange-accent rounded-lg">
                    <span className="text-exchange-text-primary">Uptime</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-exchange-border rounded-full">
                        <div className="w-[99.9%] h-2 bg-exchange-blue rounded-full"></div>
                      </div>
                      <span className="text-exchange-blue font-semibold">99.9%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
