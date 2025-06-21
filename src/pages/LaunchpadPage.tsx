
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Rocket, Clock, Users, DollarSign, TrendingUp, Calendar, Star } from 'lucide-react';

interface LaunchpadProject {
  id: string;
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  presalePrice: string;
  listingPrice: string;
  hardCap: string;
  raised: string;
  participants: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'success';
  roi: string;
  minInvestment: number;
  maxInvestment: number;
  vestingSchedule: string;
}

const LaunchpadPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<LaunchpadProject | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<string>('');

  const projects: LaunchpadProject[] = [
    {
      id: '1',
      name: 'DeFi Protocol X',
      symbol: 'DPX',
      description: 'Revolutionary DeFi protocol offering automated yield farming and cross-chain bridging solutions.',
      totalSupply: '100,000,000',
      presalePrice: '$0.05',
      listingPrice: '$0.15',
      hardCap: '$2,000,000',
      raised: '$1,450,000',
      participants: 2847,
      startDate: '2024-01-20',
      endDate: '2024-02-20',
      status: 'active',
      roi: '200%',
      minInvestment: 100,
      maxInvestment: 10000,
      vestingSchedule: '20% at TGE, 80% over 8 months'
    },
    {
      id: '2',
      name: 'MetaVerse Land',
      symbol: 'MVL',
      description: 'Virtual real estate platform enabling users to buy, sell, and develop virtual properties.',
      totalSupply: '50,000,000',
      presalePrice: '$0.20',
      listingPrice: '$0.40',
      hardCap: '$5,000,000',
      raised: '$5,000,000',
      participants: 5234,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      status: 'completed',
      roi: '100%',
      minInvestment: 200,
      maxInvestment: 20000,
      vestingSchedule: '30% at TGE, 70% over 6 months'
    },
    {
      id: '3',
      name: 'AI Trading Bot',
      symbol: 'ATB',
      description: 'AI-powered trading bot with machine learning algorithms for optimal trading strategies.',
      totalSupply: '75,000,000',
      presalePrice: '$0.08',
      listingPrice: '$0.25',
      hardCap: '$3,000,000',
      raised: '$0',
      participants: 0,
      startDate: '2024-02-15',
      endDate: '2024-03-15',
      status: 'upcoming',
      roi: '212%',
      minInvestment: 50,
      maxInvestment: 5000,
      vestingSchedule: '10% at TGE, 90% over 12 months'
    }
  ];

  const handleInvest = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!selectedProject || !investmentAmount) {
      alert('Please select a project and enter an investment amount');
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (amount < selectedProject.minInvestment || amount > selectedProject.maxInvestment) {
      alert(`Investment amount must be between $${selectedProject.minInvestment} and $${selectedProject.maxInvestment}`);
      return;
    }

    alert(`Investment of $${amount} in ${selectedProject.name} submitted successfully!`);
    setInvestmentAmount('');
    setSelectedProject(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-exchange-green/20 text-exchange-green';
      case 'upcoming':
        return 'bg-exchange-blue/20 text-exchange-blue';
      case 'completed':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'success':
        return 'bg-purple-500/20 text-purple-500';
      default:
        return 'bg-exchange-text-secondary/20 text-exchange-text-secondary';
    }
  };

  const getProgressPercentage = (raised: string, hardCap: string) => {
    const raisedAmount = parseFloat(raised.replace(/[\$,]/g, ''));
    const capAmount = parseFloat(hardCap.replace(/[\$,]/g, ''));
    return Math.min((raisedAmount / capAmount) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-exchange-text-primary">
              Launchpad
            </h1>
          </div>
          <p className="text-xl text-exchange-text-secondary max-w-3xl mx-auto">
            Discover and invest in the next generation of innovative blockchain projects. 
            Get early access to promising tokens before they hit the market.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6">
            <div className="flex items-center space-x-3">
              <Rocket className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-exchange-text-primary">47</div>
                <div className="text-sm text-exchange-text-secondary">Projects Launched</div>
              </div>
            </div>
          </div>

          <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-exchange-green" />
              <div>
                <div className="text-2xl font-bold text-exchange-text-primary">$125M</div>
                <div className="text-sm text-exchange-text-secondary">Total Raised</div>
              </div>
            </div>
          </div>

          <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-exchange-blue" />
              <div>
                <div className="text-2xl font-bold text-exchange-text-primary">23,451</div>
                <div className="text-sm text-exchange-text-secondary">Total Participants</div>
              </div>
            </div>
          </div>

          <div className="bg-exchange-panel rounded-xl border border-exchange-border p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-exchange-text-primary">340%</div>
                <div className="text-sm text-exchange-text-secondary">Average ROI</div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {projects.map((project) => (
            <div 
              key={project.id}
              className={`bg-exchange-panel rounded-xl border p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedProject?.id === project.id 
                  ? 'border-purple-500 bg-purple-500/5' 
                  : 'border-exchange-border hover:border-purple-500/50'
              }`}
              onClick={() => setSelectedProject(project)}
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-exchange-text-primary mb-1">{project.name}</h3>
                  <div className="text-sm text-exchange-text-secondary">{project.symbol}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>

              {/* Project Description */}
              <p className="text-exchange-text-secondary text-sm mb-4 line-clamp-2">
                {project.description}
              </p>

              {/* Key Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-exchange-text-secondary">Presale Price:</span>
                  <span className="text-exchange-text-primary font-semibold">{project.presalePrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-exchange-text-secondary">Listing Price:</span>
                  <span className="text-exchange-green font-semibold">{project.listingPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-exchange-text-secondary">Expected ROI:</span>
                  <span className="text-purple-500 font-semibold">{project.roi}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {project.status !== 'upcoming' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-exchange-text-secondary">Progress</span>
                    <span className="text-exchange-text-primary">{getProgressPercentage(project.raised, project.hardCap).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-exchange-border rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(project.raised, project.hardCap)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-exchange-text-secondary">Raised: {project.raised}</span>
                    <span className="text-exchange-text-secondary">Hard Cap: {project.hardCap}</span>
                  </div>
                </div>
              )}

              {/* Project Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-exchange-text-secondary" />
                  <span className="text-exchange-text-secondary">{project.participants} participants</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-exchange-text-secondary" />
                  <span className="text-exchange-text-secondary">Ends {project.endDate}</span>
                </div>
              </div>

              {selectedProject?.id === project.id && (
                <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-center text-purple-600 font-semibold">Selected Project</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Investment Form */}
        {selectedProject && (
          <div className="bg-exchange-panel rounded-xl border border-exchange-border p-8">
            <h3 className="text-2xl font-bold text-exchange-text-primary mb-6 text-center">
              Invest in {selectedProject.name}
            </h3>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Project Details */}
              <div className="space-y-4">
                <div className="bg-exchange-accent rounded-lg p-4">
                  <h4 className="font-semibold text-exchange-text-primary mb-3">Project Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-exchange-text-secondary">Total Supply:</span>
                      <span className="text-exchange-text-primary">{selectedProject.totalSupply} {selectedProject.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-exchange-text-secondary">Token Price:</span>
                      <span className="text-exchange-text-primary">{selectedProject.presalePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-exchange-text-secondary">Min Investment:</span>
                      <span className="text-exchange-text-primary">${selectedProject.minInvestment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-exchange-text-secondary">Max Investment:</span>
                      <span className="text-exchange-text-primary">${selectedProject.maxInvestment.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-exchange-accent rounded-lg p-4">
                  <h4 className="font-semibold text-exchange-text-primary mb-3">Vesting Schedule</h4>
                  <p className="text-sm text-exchange-text-secondary">{selectedProject.vestingSchedule}</p>
                </div>
              </div>

              {/* Investment Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-exchange-text-secondary mb-2">Investment Amount (USD)</label>
                  <input
                    type="number"
                    min={selectedProject.minInvestment}
                    max={selectedProject.maxInvestment}
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder={`Min: $${selectedProject.minInvestment} - Max: $${selectedProject.maxInvestment.toLocaleString()}`}
                    className="w-full px-4 py-3 bg-exchange-accent border border-exchange-border rounded-lg text-exchange-text-primary placeholder:text-exchange-text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={selectedProject.status !== 'active'}
                  />
                </div>

                {investmentAmount && (
                  <div className="bg-exchange-accent rounded-lg p-4">
                    <div className="text-sm text-exchange-text-secondary mb-2">You will receive:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Tokens:</span>
                        <span className="text-exchange-text-primary font-semibold">
                          {(parseFloat(investmentAmount) / parseFloat(selectedProject.presalePrice.replace('$', ''))).toLocaleString()} {selectedProject.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Potential Value at Listing:</span>
                        <span className="text-exchange-green font-semibold">
                          ${(parseFloat(investmentAmount) * parseFloat(selectedProject.roi.replace('%', '')) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleInvest}
                  disabled={selectedProject.status !== 'active'}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!user ? 'Login to Invest' : selectedProject.status !== 'active' ? 'Project Not Active' : 'Invest Now'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaunchpadPage;
