import React from 'react';
import Classnames from 'classnames';
import CheckBoxWithImg from './checkbox-with-img.components.jsx'

class TopBarMenu extends React.Component {
	render() {
		const headers = _.map(this.props.children,(child) => {
			const classes = Classnames({
				'top-bar-menu-item':true,
				'is-aligned-right':child.props.alignRight,
				'is-action': child.props.action,
				'is-icon-menu': !!child.props.img,
			});

			return (
				<li className={classes} key={child.props.name || child.props.img}>
					{child.type.getHeader(child.props)}
					{child}
				</li>
			)
		});
		return (
			<ul className="top-bar-menu">
				{headers}
			</ul>
		)
	}
}

class TopBarMenuDropdown extends React.Component {
	static getHeader(props) {
		const content = ({
			'title': props.name ? <span className="top-bar-menu-item-title">{props.name}</span> : false,
			'img': props.img ? <img className="top-bar-menu-item-img" src={props.img}/> : false
		});
		return {content};
	}

	render() {
		const classes = Classnames({
			'top-bar-menu-item-dropdown':true,
			'is-small':this.props.small,
		});

		return (
			<ul className={classes}>
				{this.props.children}
			</ul>
		)
	}
}

class TopBarMenuAction extends React.Component {
	static getHeader(props) {
		return <div className="top-bar-menu-action" onClick={(e) => props.click(e)}>{props.name}</div>;
	}

	render() {
		return false;
	}
}

function setupKeyboardShortcut(key,modifier,cb) {
	document.addEventListener('keydown', (e) => {
		if ((!modifier || e[`${modifier}Key`]) && e.keyCode === key.toUpperCase().charCodeAt(0)) {
			cb();
		}
	});
};

class TopBarMenuDropdownItem extends React.Component {
	componentWillMount() {
		if (this.props.shortcut) {
			let [modifier, key] = this.props.shortcut.split('+');

			if (!key) {
				key = modifier;
				modifier = undefined;
			}

			setupKeyboardShortcut(key,modifier,() => {
				this.props.handler();
			});
		}
	}
	render() {
		const classes = Classnames({
			'top-bar-menu-item-dropdown-item':true,
			'is-disabled':this.props.disabled,
		})
		return (
			<li className={classes} onClick={this.props.handler}>
				<span className="top-bar-menu-item-dropdown-item-title">{this.props.name}</span>
				<span className="top-bar-menu-item-dropdown-item-shortcut">{this.props.shortcut}</span>
			</li>
		)
	}
}

class TopBarMenuDropdownCheckBox extends React.Component {
	componentWillMount() {

	}

	render() {
		const classes = Classnames({
			'top-bar-menu-item-dropdown-item':true,
			'is-checkbox': true,
			'is-disabled':this.props.disabled,
		});

		const checkboxClasses = Classnames({
			'top-bar-menu-item-dropdown-item-checkbox':true,
			'is-checked':this.props.checked,
		});

		return (
			<li className={classes} onClick={this.props.handler}>
				<CheckBoxWithImg checked={this.props.checked}/>
				<span className="top-bar-menu-item-dropdown-item-title">{this.props.name}</span>
				<span className="top-bar-menu-item-dropdown-item-shortcut">{this.props.shortcut}</span>
			</li>
		)
	}
}

export {
	TopBarMenu,
	TopBarMenuDropdown,
	TopBarMenuDropdownItem,
	TopBarMenuDropdownCheckBox,
	TopBarMenuAction,
}