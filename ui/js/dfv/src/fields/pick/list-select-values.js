/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import {
	chevronUp,
	chevronDown,
} from '@wordpress/icons';

/**
 * Other Pods dependencies
 */
import IframeModal from 'dfv/src/components/iframe-modal';

import './list-select.scss';

const ListSelectItem = ( {
	fieldName,
	value,
	editLink,
	viewLink,
	editIframeTitle,
	icon,
	isDraggable,
	isRemovable,
	moveUp,
	moveDown,
	removeItem,
	setFieldItemData,
} ) => {
	const isDashIcon = /^dashicons/.test( icon );
	const [ showEditModal, setShowEditModal ] = useState( false );

	useEffect( () => {
		const listenForIframeMessages = ( event ) => {
			if (
				event.origin !== window.location.origin ||
				'PODS_MESSAGE' !== event.data.type ||
				! event.data.data
			) {
				return;
			}

			setShowEditModal( false );

			const { data: newData = {} } = event.data;

			setFieldItemData( ( prevData ) => prevData.map( ( item ) => {
				return ( newData.id && Number( item?.id ) === Number( newData.id ) )
					? newData
					: item;
			} ) );
		};

		if ( showEditModal ) {
			window.addEventListener( 'message', listenForIframeMessages, false );
		} else {
			window.removeEventListener( 'message', listenForIframeMessages, false );
		}

		return () => {
			window.removeEventListener( 'message', listenForIframeMessages, false );
		};
	}, [ showEditModal ] );

	return (
		<li className="pods-dfv-list-item pods-relationship">
			<ul className="pods-dfv-list-meta relationship-item">
				{ isDraggable ? (
					<li className="pods-dfv-list-col pods-dfv-list-handle pods-list-select-move-buttons">
						<Button
							className={
								classnames(
									'pods-list-select-move-buttons__button',
									! moveUp && 'pods-list-select-move-buttons__button--disabled'
								)
							}
							showTooltip
							disabled={ ! moveUp }
							onClick={ moveUp }
							icon={ chevronUp }
							label={ __( 'Move up', 'pods' ) }
						/>

						<Button
							className={
								classnames(
									'pods-list-select-move-buttons__button',
									! moveDown && 'pods-list-select-move-buttons__button--disabled'
								)
							}
							showTooltip
							disabled={ ! moveDown }
							onClick={ moveDown }
							icon={ chevronDown }
							label={ __( 'Move down', 'pods' ) }
						/>
					</li>
				) : null }

				{ icon ? (
					<li className="pods-dfv-list-col pods-dfv-list-icon">
						{ isDashIcon ? (
							<span
								className={ `pinkynail dashicons ${ icon }` }
							/>
						) : (
							<img
								className="pinkynail"
								src={ icon }
								alt="Icon"
							/>
						) }
					</li>
				) : null }

				<li className="pods-dfv-list-col pods-dfv-list-name">
					{ value.label }
				</li>

				{ isRemovable ? (
					<li className="pods-dfv-list-col pods-dfv-list-remove">
						<a
							href="#remove"
							title={ __( 'Deselect', 'pods' ) }
							onClick={ removeItem }
						>
							{ __( 'Deselect', 'pods' ) }
						</a>
					</li>
				) : null }

				{ viewLink ? (
					<li className="pods-dfv-list-col pods-dfv-list-link">
						<a
							href={ viewLink }
							title={ __( 'View', 'pods' ) }
							target="_blank"
							rel="noreferrer"
						>
							{ __( 'View', 'pods' ) }
						</a>
					</li>
				) : null }

				{ editLink ? (
					<li className="pods-dfv-list-col pods-dfv-list-edit">
						<a
							href={ editLink }
							title={ __( 'Edit', 'pods' ) }
							target="_blank"
							rel="noreferrer"
							onClick={ ( event ) => {
								event.preventDefault();
								setShowEditModal( true );
							} }
						>
							{ __( 'Edit', 'pods' ) }
						</a>
					</li>
				) : null }
			</ul>

			{ showEditModal ? (
				<IframeModal
					title={ editIframeTitle || `${ fieldName }: Edit` }
					iframeSrc={ editLink }
					onClose={ () => setShowEditModal( false ) }
				/>
			) : null }
		</li>
	);
};

ListSelectItem.propTypes = {
	fieldName: PropTypes.string.isRequired,
	value: PropTypes.shape( {
		label: PropTypes.string.isRequired,
		value: PropTypes.string.isRequired,
	} ),
	editLink: PropTypes.string,
	editIframeTitle: PropTypes.string,
	viewLink: PropTypes.string,
	icon: PropTypes.string,
	isDraggable: PropTypes.bool.isRequired,
	isRemovable: PropTypes.bool.isRequired,
	moveUp: PropTypes.func,
	moveDown: PropTypes.func,
	removeItem: PropTypes.func.isRequired,
	setFieldItemData: PropTypes.func.isRequired,
};

const ListSelectValues = ( {
	fieldName,
	value: arrayOfValues,
	fieldItemData,
	setFieldItemData,
	setValue,
	isMulti,
	limit,
	defaultIcon,
	showIcon,
	showViewLink,
	showEditLink,
	editIframeTitle,
	readOnly = false,
} ) => {
	const removeValueAtIndex = ( index = 0 ) => {
		if ( isMulti ) {
			setValue(
				[
					...arrayOfValues.slice( 0, index ),
					...arrayOfValues.slice( index + 1 ),
				].map( ( item ) => item.value )
			);
		} else {
			setValue( undefined );
		}
	};

	const swapItems = ( oldIndex, newIndex ) => {
		if ( ! isMulti ) {
			throw 'Swap items shouldn\'nt be called on a single ListSelect';
		}

		const newValues = [ ...arrayOfValues ];
		const tempValue = newValues[ newIndex ];

		newValues[ newIndex ] = newValues[ oldIndex ];
		newValues[ oldIndex ] = tempValue;

		setValue(
			newValues.map( ( item ) => item.value ),
		);
	};

	return (
		<div className="pods-pick-values">
			{ !! arrayOfValues.length && (
				<ul className="pods-dfv-list pods-relationship">
					{ arrayOfValues.map( ( valueItem, index ) => {
						// There may be additional data in an object from the fieldItemData
						// array.
						const moreData = fieldItemData.find(
							( item ) => item?.id === valueItem.value
						);

						const icon = showIcon ? ( moreData?.icon || defaultIcon ) : undefined;

						// May need to change the label, if it differs from the provided value.
						const displayValue = valueItem;

						const matchingFieldItemData = fieldItemData.find(
							( item ) => Number( item.id ) === Number( valueItem.value )
						);

						if ( matchingFieldItemData && matchingFieldItemData.name ) {
							displayValue.label = matchingFieldItemData.name;
						}

						return (
							<ListSelectItem
								key={ `${ fieldName }-${ index }` }
								fieldName={ fieldName }
								value={ displayValue }
								isDraggable={ ! readOnly && ( 1 !== limit ) }
								isRemovable={ ! readOnly }
								editLink={ ! readOnly && showEditLink ? moreData?.edit_link : undefined }
								viewLink={ showViewLink ? moreData?.link : undefined }
								editIframeTitle={ editIframeTitle }
								icon={ icon }
								removeItem={ () => removeValueAtIndex( index ) }
								setFieldItemData={ setFieldItemData }
								moveUp={
									( ! readOnly && index !== 0 )
										? () => swapItems( index, index - 1 )
										: undefined
								}
								moveDown={
									( ! readOnly && index !== ( arrayOfValues.length - 1 ) )
										? () => swapItems( index, index + 1 )
										: undefined
								}
							/>
						);
					} ) }
				</ul>
			) }
		</div>
	);
};

ListSelectValues.propTypes = {
	fieldName: PropTypes.string.isRequired,
	value: PropTypes.arrayOf(
		PropTypes.shape( {
			label: PropTypes.string.isRequired,
			value: PropTypes.string.isRequired,
		} )
	),
	setValue: PropTypes.func.isRequired,
	fieldItemData: PropTypes.arrayOf(
		PropTypes.any,
	),
	setFieldItemData: PropTypes.func.isRequired,
	isMulti: PropTypes.bool.isRequired,
	limit: PropTypes.number.isRequired,
	defaultIcon: PropTypes.string,
	showIcon: PropTypes.bool.isRequired,
	showViewLink: PropTypes.bool.isRequired,
	showEditLink: PropTypes.bool.isRequired,
	editIframeTitle: PropTypes.string,
	readOnly: PropTypes.bool,
};

export default ListSelectValues;
