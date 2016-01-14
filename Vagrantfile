# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "debian/jessie64"

  config.vm.network "forwarded_port", guest: 4000, host: 4000

  config.vm.provider "virtualbox" do |vb|
    vb.memory = "256"
  end

  config.vm.provision "shell", privileged: false, inline: <<-SHELL
    sudo apt-get update
    sudo apt-get install -y bundler ruby-dev nodejs
    cd /vagrant
    bundle install
  SHELL
end
